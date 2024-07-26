const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listmagazines')
        .setDescription('List magazines by range.')
        .addIntegerOption(option => 
            option.setName('range_start')
                .setDescription('Start of the magazine range (e.g., 1 for 1-10)')),
    async execute(interaction) {
        const rangeStart = interaction.options.getInteger('range_start') || 1;

        // Check for negative numbers and zero
        if (rangeStart <= 0) {
            const embed = new EmbedBuilder()
                .setTitle('Invalid Range')
                .setDescription('Please provide a positive integer greater than 0 for the range start.')
                .setColor(0xff0000)
                .setTimestamp()
                .setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' });

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const rangeEnd = rangeStart + 9;

        const db = new sqlite3.Database('./puzzlehunt.db', (err) => {
            if (err) {
                console.error('Database connection error:', err.message);
                const embed = new EmbedBuilder()
                    .setTitle('Database Error')
                    .setDescription('Failed to connect to the database.')
                    .setColor(0xff0000)
                    .setTimestamp()
                    .setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' });

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        });

        db.all(`SELECT number, name FROM magazine WHERE number BETWEEN ? AND ?`, [rangeStart, rangeEnd], (err, magazines) => {
            if (err) {
                console.error('Error retrieving magazines:', err.message);
                const embed = new EmbedBuilder()
                    .setTitle('Database Error')
                    .setDescription('Failed to retrieve magazines.')
                    .setColor(0xff0000)
                    .setTimestamp()
                    .setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' });

                db.close();
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            if (magazines.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('No Magazines Found')
                    .setDescription(`No magazines found in the range ${rangeStart}-${rangeEnd}.`)
                    .setColor(0xffff00)
                    .setTimestamp()
                    .setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' });

                db.close();
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const magazinesPerPage = 15;
            let pages = [];
            let currentPage = [];

            magazines.forEach((magazine, index) => {
                currentPage.push({ name: `Issue ${magazine.number}`, value: magazine.name, inline: true });

                if (currentPage.length === magazinesPerPage || index === magazines.length - 1) {
                    pages.push(currentPage);
                    currentPage = [];
                }

                if (index === magazines.length - 1) {
                    sendPage(interaction, pages, 0);
                    db.close();
                }
            });
        });
    }
};

async function sendPage(interaction, pages, pageIndex) {
    const embed = new EmbedBuilder()
        .setTitle(`Magazines Page ${pageIndex + 1}`)
        .addFields(pages[pageIndex])
        .setColor('#0099ff')
        .setTimestamp()
        .setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' });

    const buttons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('prev')
                .setLabel('??')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(pageIndex === 0),
            new ButtonBuilder()
                .setCustomId('next')
                .setLabel('??')
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
