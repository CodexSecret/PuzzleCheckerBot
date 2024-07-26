const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('View your profile and stats.'),
    async execute(interaction) {
        const userId = interaction.user.id;

        const db = new sqlite3.Database('./puzzlehunt.db', (err) => {
            if (err) {
                console.error(err.message);
                return interaction.reply({ content: 'Failed to connect to the database.', ephemeral: true });
            }
        });

        db.get(`SELECT COUNT(*) as solved_count FROM user_state WHERE user_id = ?`, [userId], (err, row) => {
            if (err) {
                console.error(err.message);
                db.close();
                return interaction.reply({ content: 'Failed to retrieve profile data.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle('Your Profile')
                .setColor('#0099ff')
                .setDescription(`Profile for <@${userId}>`)
                .addFields(
                    { name: 'Puzzles Solved', value: `${row.solved_count}`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' });

            interaction.reply({ embeds: [embed], ephemeral: true });
            db.close();
        });
    },
};
