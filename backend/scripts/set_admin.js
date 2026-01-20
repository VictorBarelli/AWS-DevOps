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

            console.log('\n📋 Lista de usuários atuais no banco:');
            const allUsers = await pool.query('SELECT id, email, role FROM users');
            if (allUsers.rows.length === 0) {
                console.log('   (Nenhum usuário no banco)');
            } else {
                allUsers.rows.forEach(u => console.log(`   - [${u.id}] ${u.email} (${u.role})`));
            }
            console.log('\nDICA: O email no banco deve ser IDÊNTICO ao que você digitou.');
        }
    } catch (e) {
        console.error('Erro ao atualizar usuário:', e);
    } finally {
        pool.end();
    }
}

run();
