const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listpuzzles')
        .setDescription('List all puzzles from a specific issue and their status.')
        .addIntegerOption(option => 
            option.setName('magazine_id')
                .setDescription('Magazine ID')
                .setRequired(true)),
    async execute(interaction) {
        const magazineId = interaction.options.getInteger('magazine_id');
        const userId = interaction.user.id;

        const db = new sqlite3.Database('./puzzlehunt.db', (err) => {
            if (err) {
                console.error('Database connection error:', err.message);
                return interaction.reply({ content: 'Failed to connect to the database.', ephemeral: true });
            }
        });

        db.get(`SELECT number, name FROM magazine WHERE id = ?`, [magazineId], (err, magazine) => {
            if (err) {
                console.error('Error retrieving magazine:', err.message);
                db.close();
                return interaction.reply({ content: 'Failed to retrieve magazine.', ephemeral: true });
            }

            if (!magazine) {
                db.close();
                return interaction.reply({ content: 'Magazine not found.', ephemeral: true });
            }

            db.all(`SELECT puzzle.id, puzzle.name 
                    FROM puzzle 
                    WHERE puzzle.magazine_id = ?`, [magazineId], async (err, puzzles) => {
                if (err) {
                    console.error('Error retrieving puzzles:', err.message);
                    db.close();
                    return interaction.reply({ content: 'Failed to retrieve puzzles.', ephemeral: true });
                }

                if (puzzles.length === 0) {
                    db.close();
                    return interaction.reply({ content: 'No puzzles found for this magazine.', ephemeral: true });
                }

                db.get(`SELECT solved_puzzles, solved_answers FROM user_state WHERE user_id = ? AND magazine_id = ?`, [userId, magazineId], (err, userState) => {
                    if (err) {
                        console.error('Error retrieving user state:', err.message);
                        db.close();
                        return interaction.reply({ content: 'Failed to retrieve user state.', ephemeral: true });
                    }

                    const solvedPuzzles = userState && userState.solved_puzzles ? userState.solved_puzzles.split(',') : [];
                    const solvedAnswers = userState && userState.solved_answers ? userState.solved_answers.split(',') : [];

                    const puzzlesPerPage = 15;
                    let pages = [];
                    let currentPage = [];

                    puzzles.forEach((puzzle, index) => {
                        db.all(`SELECT id, answer FROM answer WHERE puzzle_id = ?`, [puzzle.id], (err, answers) => {
                            if (err) {
                                console.error('Error retrieving answers:', err.message);
                                return;
                            }

                            const foundAnswers = answers.filter(answer => solvedAnswers.includes(`${puzzle.id}:${answer.id}`));
                            const allAnswers = answers.map(a => a.answer).join(', ');
                            const statusText = foundAnswers.length === answers.length
                                ? `✅ Solved: ${allAnswers}`
                                : foundAnswers.length > 0
                                    ? `❎ Partially solved: ${foundAnswers.map(a => a.answer).join(', ')} (still unsolved)`
                                    : `❌ Unsolved`;
                            currentPage.push({ name: puzzle.name, value: statusText, inline: true });

                            if (currentPage.length === puzzlesPerPage || index === puzzles.length - 1) {
                                pages.push(currentPage);
                                currentPage = [];
                            }

                            if (index === puzzles.length - 1) {
                                sendPage(interaction, magazine, pages, 0);
                                db.close();
                            }
                        });
                    });
                });
            });
        });
    }
};

async function sendPage(interaction, magazine, pages, pageIndex) {
    const embed = new EmbedBuilder()
        .setTitle(`Puzzles for Issue ${magazine.number}: ${magazine.name}`)
        .addFields(pages[pageIndex])
        .setColor('#0099ff')
        .setTimestamp()
        .setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' });

    const buttons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('prev')
                .setLabel('◀️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(pageIndex === 0),
            new ButtonBuilder()
                .setCustomId('next')
                .setLabel('▶️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(pageIndex === pages.length - 1)
        );

    const message = await interaction.reply({ embeds: [embed], components: [buttons], fetchReply: true });

    const filter = i => i.customId === 'prev' || i.customId === 'next';
    const collector = message.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async i => {
        if (i.customId === 'prev') {
            pageIndex--;
        } else if (i.customId === 'next') {
            pageIndex++;
        }
        await i.update({ embeds: [new EmbedBuilder(embed).setFields(pages[pageIndex])], components: [new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('◀️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(pageIndex === 0),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('▶️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(pageIndex === pages.length - 1)
            )] });
    });

    collector.on('end', collected => {
        const disabledButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('◀️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('▶️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true)
            );

        message.edit({ components: [disabledButtons] });
    });
}
