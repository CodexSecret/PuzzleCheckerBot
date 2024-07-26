const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

const allowedUsername = '<ADD YOUR OWN USERNAME>';
const allowedUserId = '<ADD YOUR OWN ID>';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('updatemagazine')
        .setDescription('Update magazine information.')
        .addIntegerOption(option =>
            option.setName('magazine_id')
                .setDescription('Magazine ID')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('new_name')
                .setDescription('New magazine name')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('new_number')
                .setDescription('New magazine number')
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
        const newName = interaction.options.getString('new_name');
        const newNumber = interaction.options.getInteger('new_number');

        if (!newName && !newNumber) {
            const embed = new EmbedBuilder()
                .setTitle('Invalid Input')
                .setDescription('You must provide either a new name or a new number for the magazine.')
                .setColor(0xff0000)
                .setTimestamp()
                .setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' });

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

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

        let updateQuery = 'UPDATE magazine SET ';
        const updateParams = [];

        if (newName) {
            updateQuery += 'name = ?, ';
            updateParams.push(newName);
        }

        if (newNumber) {
            updateQuery += 'number = ?, ';
            updateParams.push(newNumber);
        }

        // Remove the last comma and add the WHERE clause
        updateQuery = updateQuery.slice(0, -2) + ' WHERE id = ?';
        updateParams.push(magazineId);

        db.run(updateQuery, updateParams, function(err) {
            if (err) {
                console.error(err.message);
                const embed = new EmbedBuilder()
                    .setTitle('Database Error')
                    .setDescription('Failed to update magazine information.')
                    .setColor(0xff0000)
                    .setTimestamp()
                    .setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' });

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle('Success')
                .setDescription(`Magazine information updated successfully.`)
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
    }
};
