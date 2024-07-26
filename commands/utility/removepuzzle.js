const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

const allowedUsername = '<ADD YOUR OWN USERNAME>';
const allowedUserId = '<ADD YOUR OWN ID>';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removepuzzle')
        .setDescription('Remove a puzzle from the database.')
        .addIntegerOption(option =>
            option.setName('magazine_id')
                .setDescription('Magazine ID')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('puzzle_name')
                .setDescription('Puzzle name')
                .setAutocomplete(true)
                .setRequired(true)),
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
        const puzzleName = interaction.options.getString('puzzle_name');

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

        db.get(`SELECT id FROM puzzle WHERE magazine_id = ? AND name = ?`, [magazineId, puzzleName], (err, puzzle) => {
            if (err) {
                console.error(err.message);
                const embed = new EmbedBuilder()
                    .setTitle('Database Error')
                    .setDescription('Failed to retrieve puzzle.')
                    .setColor(0xff0000)
                    .setTimestamp()
                    .setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' });

                db.close();
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            if (!puzzle) {
                const embed = new EmbedBuilder()
                    .setTitle('Not Found')
                    .setDescription('Puzzle not found.')
                    .setColor(0xff0000)
                    .setTimestamp()
                    .setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' });

                db.close();
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const puzzleId = puzzle.id;

            db.serialize(() => {
                db.run(`DELETE FROM puzzle WHERE id = ?`, [puzzleId], function (err) {
                    if (err) {
                        console.error(err.message);
                        const embed = new EmbedBuilder()
                            .setTitle('Database Error')
                            .setDescription('Failed to remove puzzle.')
                            .setColor(0xff0000)
                            .setTimestamp()
                            .setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' });

                        return interaction.reply({ embeds: [embed], ephemeral: true });
                    }
                });

                db.run(`DELETE FROM answer WHERE puzzle_id = ?`, [puzzleId], function (err) {
                    if (err) {
                        console.error(err.message);
                        const embed = new EmbedBuilder()
                            .setTitle('Database Error')
                            .setDescription('Failed to remove answers for the puzzle.')
                            .setColor(0xff0000)
                            .setTimestamp()
                            .setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' });

                        return interaction.reply({ embeds: [embed], ephemeral: true });
                    }
                });

                db.run(`DELETE FROM user_state WHERE solved_puzzles LIKE ? OR solved_answers LIKE ?`, [`%${puzzleId}%`, `%${puzzleId}%`], function (err) {
                    if (err) {
                        console.error(err.message);
                        const embed = new EmbedBuilder()
                            .setTitle('Database Error')
                            .setDescription('Failed to update user states.')
                            .setColor(0xff0000)
                            .setTimestamp()
                            .setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' });

                        return interaction.reply({ embeds: [embed], ephemeral: true });
                    }
                });

                db.run(`DELETE FROM errata WHERE puzzle_id = ?`, [puzzleId], function (err) {
                    if (err) {
                        console.error(err.message);
                        const embed = new EmbedBuilder()
                            .setTitle('Database Error')
                            .setDescription('Failed to remove errata for the puzzle.')
                            .setColor(0xff0000)
                            .setTimestamp()
                            .setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' });

                        return interaction.reply({ embeds: [embed], ephemeral: true });
                    }
                });

                db.run(`DELETE FROM keep_going_statement WHERE puzzle_id = ?`, [puzzleId], function (err) {
                    if (err) {
                        console.error(err.message);
                        const embed = new EmbedBuilder()
                            .setTitle('Database Error')
                            .setDescription('Failed to remove keep going statements for the puzzle.')
                            .setColor(0xff0000)
                            .setTimestamp()
                            .setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' });

                        return interaction.reply({ embeds: [embed], ephemeral: true });
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('Success')
                        .setDescription(`Puzzle "${puzzleName}" removed successfully along with all related data.`)
                        .setColor(0x00ff00)
                        .setTimestamp()
                        .setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' });

                    interaction.reply({ embeds: [embed], ephemeral: true });
                });
            });

            db.close((err) => {
                if (err) {
                    console.error(err.message);
                }
            });
        });
    },
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        if (focusedOption.name === 'puzzle_name') {
            const magazineId = interaction.options.getInteger('magazine_id');

            const db = new sqlite3.Database('./puzzlehunt.db', (err) => {
                if (err) {
                    console.error('Database connection error:', err.message);
                    return interaction.respond([]);
                }
            });

            db.all(`SELECT name FROM puzzle WHERE magazine_id = ?`, [magazineId], (err, rows) => {
                if (err) {
                    console.error('Error retrieving puzzles:', err.message);
                    db.close();
                    return interaction.respond([]);
                }

                const choices = rows.map(row => row.name);
                const filtered = choices.filter(choice => choice.toLowerCase().startsWith(focusedOption.value.toLowerCase()));
                interaction.respond(filtered.map(choice => ({ name: choice, value: choice })));
                db.close();
            });
        }
    }
};
