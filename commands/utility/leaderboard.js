const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the top solvers.'),
    async execute(interaction) {
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

        db.all(`SELECT user_id, COUNT(*) as solved_count FROM user_state GROUP BY user_id ORDER BY solved_count DESC LIMIT 10`, (err, rows) => {
            if (err) {
                console.error(err.message);
                const embed = new EmbedBuilder()
                    .setTitle('Database Error')
                    .setDescription('Failed to retrieve leaderboard.')
                    .setColor(0xff0000)
                    .setTimestamp()
                    .setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' });

                db.close();
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle('Leaderboard')
                .setColor(0x00ff00)
                .setTimestamp()
                .setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' });

            if (rows.length > 0) {
                rows.forEach((row, index) => {
                    embed.addFields({ name: `Rank ${index + 1}`, value: `<@${row.user_id}> - ${row.solved_count} puzzles solved`, inline: true });
                });
            } else {
                embed.setDescription('No solvers found.');
            }

            interaction.reply({ embeds: [embed], ephemeral: false });
            db.close();
        });
    }
};
