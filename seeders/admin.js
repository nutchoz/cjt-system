'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
    async up(queryInterface, Sequelize) {
        const passwordHash = await bcrypt.hash('admin123', 10);

        await queryInterface.bulkInsert('Admins', [
            {
                name: 'System Administrator',
                email: 'admin@example.com',
                role: 'admin',
                password_hash: passwordHash,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('Admins', {
            email: 'admin@example.com',
        });
    },
};