const { pool } = require('../src/db');

async function setAdmin(email) {
    try {
        console.log(`🔄 Buscando usuário ${email}...`);

        let result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            console.log(`⚠️  Usuário ${email} não encontrado no banco.`);
            console.log(`✨ Criando usuário automaticamente...`);

            // Create the user with admin role directly
            result = await pool.query(
                'INSERT INTO users (email, name, role, password_hash) VALUES ($1, $2, $3, $4) RETURNING *',
                [email, email.split('@')[0], 'admin', 'cognito_managed']
            );

            console.log(`✅ Usuário ${email} criado com sucesso como ADMIN!`);
        } else {
            console.log(`✅ Usuário encontrado: ${result.rows[0].email} (${result.rows[0].role})`);
            console.log(`🔄 Atualizando para role ADMIN...`);

            // Update to admin
            await pool.query('UPDATE users SET role = $1 WHERE email = $2', ['admin', email]);
            console.log(`✅ Role atualizada para ADMIN!`);
        }

        // Verify
        const verify = await pool.query('SELECT id, email, name, role FROM users WHERE email = $1', [email]);
        console.log('\n✅ SUCESSO! Usuário admin configurado:');
        console.log(`   ID: ${verify.rows[0].id}`);
        console.log(`   Email: ${verify.rows[0].email}`);
        console.log(`   Nome: ${verify.rows[0].name}`);
        console.log(`   Role: ${verify.rows[0].role}`);

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error);
        await pool.end();
        process.exit(1);
    }
}

// Get email from command line
const email = process.argv[2];

if (!email) {
    console.error('❌ Uso: node set_admin.js <email>');
    process.exit(1);
}

setAdmin(email);
