const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listerrata')
        .setDescription('List all errata for a specific magazine and optionally a specific puzzle.')
        .addIntegerOption(option => 
            option.setName('magazine_id')
                .setDescription('Magazine ID')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('puzzle_name')
                .setDescription('Puzzle name')
                .setAutocomplete(true)
                .setRequired(false)),
    async execute(interaction) {
        const magazineId = interaction.options.getInteger('magazine_id');
        const puzzleName = interaction.options.getString('puzzle_name');

        const db = new sqlite3.Database('./puzzlehunt.db', (err) => {
            if (err) {
                console.error('Database connection error:', err.message);
                return interaction.reply({ embeds: [new EmbedBuilder().setTitle('Database Error').setDescription('Failed to connect to the database.').setColor(0xff0000).setTimestamp().setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' })], ephemeral: true });
            }
        });

        let query;
        let params;
        if (puzzleName) {
            query = `SELECT puzzle.name AS puzzle_name, IFNULL(errata.errata_text, 'No errata for this puzzle.') AS errata_text FROM puzzle
                     LEFT JOIN errata ON puzzle.id = errata.puzzle_id
                     WHERE puzzle.magazine_id = ? AND puzzle.name = ?`;
            params = [magazineId, puzzleName];
        } else {
            query = `SELECT puzzle.name AS puzzle_name, errata.errata_text FROM puzzle
                     LEFT JOIN errata ON puzzle.id = errata.puzzle_id
                     WHERE puzzle.magazine_id = ?`;
            params = [magazineId];
        }

        db.all(query, params, (err, rows) => {
            if (err) {
                console.error('Error retrieving errata:', err.message);
                db.close();
                return interaction.reply({ embeds: [new EmbedBuilder().setTitle('Database Error').setDescription('Failed to retrieve errata.').setColor(0xff0000).setTimestamp().setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' })], ephemeral: true });
            }

            if (rows.length === 0) {
                db.close();
                return interaction.reply({ embeds: [new EmbedBuilder().setTitle('No Puzzles Found').setDescription('No puzzles found for this magazine.').setColor(0xffff00).setTimestamp().setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' })], ephemeral: true });
            }

            const errataPerPage = 15;
            let pages = [];
            let currentPage = [];

            rows.forEach((row, index) => {
                if (row.errata_text || puzzleName) {
                    currentPage.push({ name: `Puzzle: ${row.puzzle_name}`, value: row.errata_text || 'No errata for this puzzle.', inline: true });
                }

                if (currentPage.length === errataPerPage || index === rows.length - 1) {
                    if (currentPage.length > 0) {
                        pages.push(currentPage);
                        currentPage = [];
                    }
                }

                if (index === rows.length - 1 && pages.length > 0) {
                    sendPage(interaction, pages, 0);
                    db.close();
                } else if (index === rows.length - 1) {
                    interaction.reply({ embeds: [new EmbedBuilder().setTitle('No Errata Found').setDescription('No errata found for the puzzles in this magazine.').setColor(0xffff00).setTimestamp().setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' })], ephemeral: true });
                    db.close();
                }
            });
        });
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

async function sendPage(interaction, pages, pageIndex) {
    const embed = new EmbedBuilder()
        .setTitle(`Errata for Magazine ID ${interaction.options.getInteger('magazine_id')}${interaction.options.getString('puzzle_name') ? ` - ${interaction.options.getString('puzzle_name')}` : ''}`)
        .addFields(pages[pageIndex])
        .setColor(0x00ff00)
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
