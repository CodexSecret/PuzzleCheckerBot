const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

const allowedUsername = '<ADD YOUR OWN USERNAME>';
const allowedUserId = '<ADD YOUR OWN ID>';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addkeepgoing')
        .setDescription('Add a keep going statement to a puzzle.')
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
            option.setName('answer_fragment')
                .setDescription('Part of the incorrect answer that triggers this statement')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('statement')
                .setDescription('Keep going statement')
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
        const puzzleName = interaction.options.getString('puzzle_name');
        const answerFragment = interaction.options.getString('answer_fragment').replace(/\s+/g, '');
        let statement = interaction.options.getString('statement');

        const defaultMessage = `${answerFragment.toUpperCase()} is a clue for this puzzle.`;

        if (statement) {
            statement = `${defaultMessage}\n${statement}`;
        } else {
            statement = defaultMessage;
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

        db.get(`SELECT id FROM puzzle WHERE magazine_id = ? AND name = ?`, [magazineId, puzzleName], (err, puzzle) => {
            if (err) {
                console.error('Error retrieving puzzle:', err.message);
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

            db.run(`INSERT INTO keep_going_statement (puzzle_id, answer_fragment, statement) VALUES (?, ?, ?)`, 
                [puzzleId, answerFragment, statement], function(err) {
                if (err) {
                    console.error(err.message);
                    const embed = new EmbedBuilder()
                        .setTitle('Database Error')
                        .setDescription('Failed to add keep going statement.')
                        .setColor(0xff0000)
                        .setTimestamp()
                        .setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' });

                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }

                const embed = new EmbedBuilder()
                    .setTitle('Statement Added')
                    .setDescription(`Keep going statement added to puzzle "${puzzleName}" successfully.`)
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
            });

            db.close((err) => {
                if (err) {
                    console.error(err.message);
                }
            });
        }
    }
};
