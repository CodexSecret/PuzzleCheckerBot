const { SlashCommandBuilder, MessageAttachment, EmbedBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkanswer')
        .setDescription('Check your answer for a puzzle.')
        .addIntegerOption(option => 
            option.setName('magazine_id')
                .setDescription('Magazine ID')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('puzzle_name')
                .setDescription('Puzzle name')
                .setAutocomplete(true)
                .setRequired(true))
        .addStringOption(option => 
            option.setName('answer')
                .setDescription('Your answer')
                .setRequired(true)),
    async execute(interaction) {
        try {
            const magazineId = interaction.options.getInteger('magazine_id');
            const puzzleName = interaction.options.getString('puzzle_name');
            const userAnswer = interaction.options.getString('answer').toLowerCase().replace(/\s+/g, '');
            const userId = interaction.user.id;

            const db = new sqlite3.Database('./puzzlehunt.db', (err) => {
                if (err) {
                    console.error('Database connection error:', err.message);
                    return interaction.reply({ embeds: [new EmbedBuilder().setTitle('Database Error').setDescription('Failed to connect to the database.').setColor(0xff0000).setTimestamp().setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' })], ephemeral: true });
                }
            });

            db.get(`SELECT * FROM puzzle WHERE magazine_id = ? AND name = ?`, [magazineId, puzzleName], (err, puzzle) => {
                if (err) {
                    console.error('Error retrieving puzzle:', err.message);
                    db.close();
                    return interaction.reply({ embeds: [new EmbedBuilder().setTitle('Database Error').setDescription('Failed to retrieve puzzle.').setColor(0xff0000).setTimestamp().setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' })], ephemeral: true });
                }

                if (!puzzle) {
                    db.close();
                    return interaction.reply({ embeds: [new EmbedBuilder().setTitle('Not Found').setDescription('Puzzle not found.').setColor(0xff0000).setTimestamp().setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' })], ephemeral: true });
                }

                db.all(`SELECT id, REPLACE(answer, ' ', '') as answer FROM answer WHERE puzzle_id = ?`, [puzzle.id], (err, answers) => {
                    if (err) {
                        console.error('Error retrieving answers:', err.message);
                        db.close();
                        return interaction.reply({ embeds: [new EmbedBuilder().setTitle('Database Error').setDescription('Failed to retrieve answers.').setColor(0xff0000).setTimestamp().setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' })], ephemeral: true });
                    }

                    const correctAnswers = answers.map(a => a.answer.toLowerCase());
                    if (correctAnswers.includes(userAnswer)) {
                        // Update user state
                        db.get(`SELECT * FROM user_state WHERE user_id = ? AND magazine_id = ?`, [userId, magazineId], (err, userState) => {
                            if (err) {
                                console.error('Error retrieving user state:', err.message);
                                db.close();
                                return interaction.reply({ embeds: [new EmbedBuilder().setTitle('Database Error').setDescription('Failed to retrieve user state.').setColor(0xff0000).setTimestamp().setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' })], ephemeral: true });
                            }

                            let solvedPuzzles = userState ? userState.solved_puzzles.split(',') : [];
                            let solvedAnswers = userState ? userState.solved_answers.split(',') : [];

                            const answerId = answers.find(a => a.answer.toLowerCase() === userAnswer).id;
                            const answerKey = `${puzzle.id}:${answerId}`;

                            if (!solvedPuzzles.includes(puzzle.id.toString())) {
                                solvedPuzzles.push(puzzle.id.toString());
                            }
                            if (!solvedAnswers.includes(answerKey)) {
                                solvedAnswers.push(answerKey);
                            }

                            const solvedPuzzlesStr = solvedPuzzles.join(',');
                            const solvedAnswersStr = solvedAnswers.join(',');

                            db.run(`INSERT INTO user_state (user_id, magazine_id, solved_puzzles, solved_answers) VALUES (?, ?, ?, ?)
                                    ON CONFLICT(user_id, magazine_id) DO UPDATE SET solved_puzzles = ?, solved_answers = ?`, 
                                    [userId, magazineId, solvedPuzzlesStr, solvedAnswersStr, solvedPuzzlesStr, solvedAnswersStr], (err) => {
                                if (err) {
                                    console.error('Error updating user state:', err.message);
                                    db.close();
                                    return interaction.reply({ embeds: [new EmbedBuilder().setTitle('Database Error').setDescription('Failed to update user state.').setColor(0xff0000).setTimestamp().setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' })], ephemeral: true });
                                }

                                const embed = new EmbedBuilder()
                                    .setTitle('Correct Answer')
                                    .setDescription(`${userAnswer.toUpperCase()} is correct!`)
                                    .setColor(0x00ff00)
                                    .setTimestamp()
                                    .setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' });

                                if (puzzle.correct_text) {
                                    embed.addFields({ name: 'Correct Text', value: puzzle.correct_text });
                                }

                                if (puzzle.correct_image) {
                                    const attachment = new MessageAttachment(puzzle.correct_image);
                                    interaction.reply({ embeds: [embed], files: [attachment], ephemeral: true });
                                } else {
                                    interaction.reply({ embeds: [embed], ephemeral: true });
                                }

                                db.close();
                            });
                        });
                    } else {
                        db.get(`SELECT statement FROM keep_going_statement WHERE puzzle_id = ? AND REPLACE(answer_fragment, ' ', '') = ? COLLATE NOCASE`, [puzzle.id, userAnswer], (err, keepGoing) => {
                            if (err) {
                                console.error('Error retrieving keep going statements:', err.message);
                                db.close();
                                return interaction.reply({ embeds: [new EmbedBuilder().setTitle('Database Error').setDescription('Failed to retrieve keep going statements.').setColor(0xff0000).setTimestamp().setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' })], ephemeral: true });
                            }
                            
                            if (keepGoing) {
                                interaction.reply({ embeds: [new EmbedBuilder().setTitle('Keep Going').setDescription(keepGoing.statement.replace(/\\n/g, '\n')).setColor(0xffff00).setTimestamp().setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' })], ephemeral: true });
                            } else {
                                interaction.reply({ embeds: [new EmbedBuilder().setTitle('Incorrect Answer').setDescription(`${userAnswer.toUpperCase()} is incorrect.`).setColor(0xff0000).setTimestamp().setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' })], ephemeral: true });
                            }
                            db.close();
                        });
                    }
                });
            });
        } catch (error) {
            console.error('Unexpected error:', error);
            interaction.reply({ embeds: [new EmbedBuilder().setTitle('Error').setDescription('There was an error while executing this command!').setColor(0xff0000).setTimestamp().setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' })], ephemeral: true });
        }
    },
    async autocomplete(interaction) {
        try {
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

                    const choices = rows.map(row => ({ name: row.name, value: row.name }));

                    // Filter and limit to top 10 matches
                    const filtered = choices.filter(choice => choice.name.toLowerCase().includes(focusedOption.value.toLowerCase())).slice(0, 10);
                    interaction.respond(filtered);
                    db.close();
                });
            }
        } catch (error) {
            console.error('Unexpected error during autocomplete:', error);
            interaction.respond([]);
        }
    }
};
