require('dotenv').config();
const { pool } = require('../src/db');

const email = process.argv[2];

if (!email) {
    console.error('⚠️  Por favor, forneça o email do usuário.');
    console.error('Exemplo: node scripts/set_admin.js usuario@exemplo.com');
    process.exit(1);
}

async function run() {
    try {
        console.log(`🔄 Buscando usuário ${email}...`);
        const res = await pool.query("UPDATE users SET role = 'admin' WHERE email = $1 RETURNING id, name, email, role", [email]);

        if (res.rows.length > 0) {
            console.log(`\n✅ SUCESSO! O usuário ${email} agora é um ADMIN.`);
            console.table(res.rows[0]);
        } else {
            console.log(`\n❌ Usuário ${email} não encontrado no banco de dados.`);
            console.log('Certifique-se de ter feito login pelo menos uma vez para que o usuário seja criado.');
        }
    } catch (e) {
        console.error('Erro ao atualizar usuário:', e);
    } finally {
        pool.end();
    }
}

run();
