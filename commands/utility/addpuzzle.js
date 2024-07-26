const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

const allowedUsername = '<ADD YOUR OWN USERNAME>';
const allowedUserId = '<ADD YOUR OWN ID>';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addpuzzle')
        .setDescription('Add a new puzzle to a magazine.')
        .addIntegerOption(option => 
            option.setName('magazine_id')
                .setDescription('Magazine ID')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('name')
                .setDescription('Puzzle name')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('correct_text')
                .setDescription('Text shown if the answer is correct')
                .setRequired(false))
        .addStringOption(option => 
            option.setName('correct_image')
                .setDescription('URL or path to an image shown if the answer is correct')
                .setRequired(false)),
    async execute(interaction) {
        // Check if the user is allowed to run the command
        if (interaction.user.username !== allowedUsername && interaction.user.id !== allowedUserId) {
            const embed = new EmbedBuilder()
                .setTitle('Permission Denied')
                .setDescription('You do not have permission to use this command.')
                .setColor(0xff0000)
                .setTimestamp()
                .setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' });

            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        const magazineId = interaction.options.getInteger('magazine_id');
        const name = interaction.options.getString('name');
        const correctText = interaction.options.getString('correct_text') || '';
        const correctImage = interaction.options.getString('correct_image') || '';

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

        db.run(`INSERT INTO puzzle (magazine_id, name, correct_text, correct_image) VALUES (?, ?, ?, ?)`, 
            [magazineId, name, correctText, correctImage], function(err) {
            if (err) {
                console.error(err.message);
                const embed = new EmbedBuilder()
                    .setTitle('Database Error')
                    .setDescription('Failed to add puzzle.')
                    .setColor(0xff0000)
                    .setTimestamp()
                    .setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' });

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle('Puzzle Added')
                .setDescription(`Puzzle "${name}" added to magazine ID ${magazineId} successfully.`)
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
