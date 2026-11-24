require('dotenv').config();
const readline = require('readline');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = process.argv[i + 1];
      args[key] = val;
      i++;
    }
  }
  return args;
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (ans) => {
      rl.close();
      resolve(ans);
    });
  });
}

async function main() {
  let { name, email, password } = parseArgs();

  if (!name) name = await ask('Nama admin: ');
  if (!email) email = await ask('Email admin: ');
  if (!password) password = await ask('Password admin: ');

  if (!name || !email || !password) {
    console.error('Nama, email, dan password wajib diisi');
    process.exit(1);
  }
  if (password.length < 6) {
    console.error('Password minimal 6 karakter');
    process.exit(1);
  }

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      console.error('Email sudah terdaftar');
      process.exit(1);
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashed, 'admin']
    );

    console.log('Akun admin berhasil dibuat');
    console.log('ID:', result.insertId);
    console.log('Email:', email);
    console.log('Role: admin');
    process.exit(0);
  } catch (error) {
    console.error('Gagal membuat admin:', error.message);
    process.exit(1);
  }
}

main();
