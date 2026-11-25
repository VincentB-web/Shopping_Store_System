import { createHmac, timingSafeEqual } from 'node:crypto';
import { getConnectionString } from '@netlify/database';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: getConnectionString() });
let schemaReady;
const seed = [
  ['Classic Burger','Burgers',89,24,'🍔'],['Cheese Burger','Burgers',109,18,'🍔'],['Bacon Burger','Burgers',139,12,'🍔'],
  ['Fries','Street food',49,30,'🍟'],['Chicken Popcorn','Street food',79,20,'🍗'],['Fishball (10 pcs)','Street food',35,40,'🍢'],
  ['Wintermelon Milk Tea','Milk tea',79,22,'🧋'],['Taro Milk Tea','Milk tea',89,16,'🧋'],['Okinawa Milk Tea','Milk tea',89,14,'🧋'],
  ['Iced Coffee','Drinks',59,25,'🥤'],['Cheese Sticks','Street food',55,15,'🧀'],['Hotdog Sandwich','Street food',65,17,'🌭'],
];

async function ensureSchema() {
  if (!schemaReady) schemaReady = (async () => {
    await pool.query(`CREATE TABLE IF NOT EXISTS products (
      id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL,
      price NUMERIC(10,2) NOT NULL, stock INTEGER NOT NULL DEFAULT 0,
      emoji TEXT NOT NULL DEFAULT '🍔', active BOOLEAN NOT NULL DEFAULT TRUE,
      CONSTRAINT products_name_category_unique UNIQUE(name, category)
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS sales (
      id BIGSERIAL PRIMARY KEY, total NUMERIC(10,2) NOT NULL, payment TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS sale_items (
      id BIGSERIAL PRIMARY KEY, sale_id BIGINT NOT NULL REFERENCES sales(id),
      product_id BIGINT NOT NULL, name TEXT NOT NULL, quantity INTEGER NOT NULL, price NUMERIC(10,2) NOT NULL
    )`);
    for (const item of seed) await pool.query(
      'INSERT INTO products(name,category,price,stock,emoji) VALUES($1,$2,$3,$4,$5) ON CONFLICT(name,category) DO NOTHING', item
    );
  })().catch(error => { schemaReady = undefined; throw error; });
  return schemaReady;
}

const json = (data, status = 200, headers = {}) => Response.json(data, { status, headers });
const cookieName = 'stall_session';
function sign(value) { return createHmac('sha256', process.env.POS_SESSION_SECRET).update(value).digest('hex'); }
function issueCookie() {
  const expires = String(Math.floor(Date.now() / 1000) + 12 * 60 * 60);
  const value = `${expires}.${sign(expires)}`;
  return `${cookieName}=${value}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200`;
}
function isSignedIn(request) {
  const cookie = request.headers.get('cookie') || '';
  const value = cookie.split(';').map(part => part.trim()).find(part => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  if (!value || !process.env.POS_SESSION_SECRET) return false;
  const [expires, signature] = value.split('.');
  if (!expires || !signature || Number(expires) < Date.now() / 1000) return false;
  const expected = sign(expires);
  return signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
async function readBody(request) {
  try { return await request.json(); } catch { return {}; }
}

export default async function handler(request) {
  try {
    if (!process.env.POS_ADMIN_PASSWORD || !process.env.POS_SESSION_SECRET) return json({ error: 'POS login is not configured.' }, 503);
    const url = new URL(request.url);
    const action = url.searchParams.get('api');
    if (action === 'login' && request.method === 'POST') {
      const body = await readBody(request);
      if (typeof body.password !== 'string' || body.password !== process.env.POS_ADMIN_PASSWORD) return json({ error: 'Incorrect password.' }, 401);
      return json({ ok: true }, 200, { 'Set-Cookie': issueCookie() });
    }
    if (!isSignedIn(request)) return json({ error: 'Sign in to continue.' }, 401);
    await ensureSchema();

    if (action === 'products' && request.method === 'GET') {
      const result = await pool.query('SELECT id,name,category,price,stock,emoji,active FROM products WHERE active=TRUE ORDER BY id');
      return json(result.rows);
    }
    if (action === 'sales' && request.method === 'GET') {
      const [sales, today, low] = await Promise.all([
        pool.query(`SELECT s.id,s.total,s.payment,s.created_at,
          (SELECT COUNT(*) FROM sale_items i WHERE i.sale_id=s.id) AS lines
          FROM sales s ORDER BY s.id DESC LIMIT 30`),
        pool.query(`SELECT COALESCE(SUM(total),0) AS total, COUNT(*) AS orders FROM sales
          WHERE created_at >= date_trunc('day', NOW() AT TIME ZONE 'Asia/Manila') AT TIME ZONE 'Asia/Manila'`),
        pool.query('SELECT COUNT(*) FROM products WHERE active=TRUE AND stock<=5'),
      ]);
      return json({ sales: sales.rows, today: today.rows[0], low: Number(low.rows[0].count) });
    }
    if (action === 'product' && request.method === 'POST') {
      const body = await readBody(request); const name = String(body.name || '').trim(); const category = String(body.category || '').trim();
      const price = Number(body.price); const stock = Number(body.stock); const emoji = String(body.emoji || '🍔').trim();
      if (!name || !category || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0) return json({ error: 'Enter a name, category, valid price and stock.' }, 422);
      await pool.query('INSERT INTO products(name,category,price,stock,emoji) VALUES($1,$2,$3,$4,$5)', [name,category,price,stock,emoji]);
      return json({ ok: true });
    }
    if (action === 'product' && request.method === 'PUT') {
      const body = await readBody(request); const id = Number(url.searchParams.get('id')); const name = String(body.name || '').trim(); const category = String(body.category || '').trim();
      const price = Number(body.price); const stock = Number(body.stock); const emoji = String(body.emoji || '🍔').trim();
      if (!Number.isInteger(id) || !name || !category || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0) return json({ error: 'Enter a name, category, valid price and stock.' }, 422);
      const result = await pool.query('UPDATE products SET name=$1,category=$2,price=$3,stock=$4,emoji=$5 WHERE id=$6 AND active=TRUE', [name,category,price,stock,emoji,id]);
      return result.rowCount ? json({ ok: true }) : json({ error: 'Product not found.' }, 404);
    }
    if (action === 'product' && request.method === 'DELETE') {
      const result = await pool.query('UPDATE products SET active=FALSE WHERE id=$1', [Number(url.searchParams.get('id'))]);
      return json({ ok: true, deleted: result.rowCount > 0 });
    }
    if (action === 'stock' && request.method === 'POST') {
      const body = await readBody(request); const change = Number(body.change); const id = Number(body.id);
      if (!Number.isInteger(change) || !Number.isInteger(id)) return json({ error: 'Invalid stock update.' }, 422);
      await pool.query('UPDATE products SET stock=GREATEST(0,stock+$1) WHERE id=$2 AND active=TRUE', [change,id]);
      return json({ ok: true });
    }
    if (action === 'checkout' && request.method === 'POST') {
      const body = await readBody(request); const items = Array.isArray(body.items) ? body.items : [];
      const payment = ['Cash','GCash'].includes(body.payment) ? body.payment : 'Cash';
      if (!items.length) return json({ error: 'Your cart is empty.' }, 422);
      const client = await pool.connect();
      try {
        await client.query('BEGIN'); let total = 0; const lines = [];
        for (const line of items) {
          const id = Number(line.id), quantity = Number(line.quantity);
          if (!Number.isInteger(id) || !Number.isInteger(quantity) || quantity < 1) throw new Error('Invalid cart item.');
          const result = await client.query('SELECT * FROM products WHERE id=$1 AND active=TRUE FOR UPDATE', [id]);
          const product = result.rows[0];
          if (!product || product.stock < quantity) throw new Error(product ? `${product.name} has only ${product.stock} left in stock.` : 'A product is no longer available.');
          total += Number(product.price) * quantity; lines.push({ product, quantity });
        }
        const sale = await client.query('INSERT INTO sales(total,payment) VALUES($1,$2) RETURNING id', [total,payment]);
        for (const { product, quantity } of lines) {
          await client.query('INSERT INTO sale_items(sale_id,product_id,name,quantity,price) VALUES($1,$2,$3,$4,$5)', [sale.rows[0].id,product.id,product.name,quantity,product.price]);
          await client.query('UPDATE products SET stock=stock-$1 WHERE id=$2', [quantity,product.id]);
        }
        await client.query('COMMIT'); return json({ ok: true, id: sale.rows[0].id, total });
      } catch (error) {
        await client.query('ROLLBACK'); return json({ error: error.message || 'Could not save the order.' }, 422);
      } finally { client.release(); }
    }
    return json({ error: 'Unknown action.' }, 404);
  } catch (error) {
    console.error('POS API error:', error);
    return json({ error: 'The POS service could not complete that request.' }, 500);
  }
}
