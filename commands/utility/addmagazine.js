const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addmagazine')
        .setDescription('Add a new magazine.')
        .addIntegerOption(option => 
            option.setName('number')
                .setDescription('Magazine number')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('name')
                .setDescription('Magazine name')
                .setRequired(true)),
    async execute(interaction) {
        const number = interaction.options.getInteger('number');
        const name = interaction.options.getString('name');

        const db = new sqlite3.Database('./puzzlehunt.db', (err) => {
            if (err) {
                console.error(err.message);
                const embed = new EmbedBuilder()
                    .setTitle('Database Error')
                    .setDescription('Failed to connect to the database.')
                    .setColor(0xff0000)
                    .setTimestamp()
                    .setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' });

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        });

        db.run(`INSERT INTO magazine (number, name) VALUES (?, ?)`, [number, name], function(err) {
            if (err) {
                console.error(err.message);
                const embed = new EmbedBuilder()
                    .setTitle('Database Error')
                    .setDescription('Failed to add magazine.')
                    .setColor(0xff0000)
                    .setTimestamp()
                    .setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' });

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle('Magazine Added')
                .setDescription(`Magazine "${name}" with number ${number} added successfully.`)
                .setColor(0x00ff00)
                .setTimestamp()
                .setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' });

            interaction.reply({ embeds: [embed], ephemeral: true });
        });

        db.close((err) => {
            if (err) {
                console.error(err.message);
            }
        });
    },
};
