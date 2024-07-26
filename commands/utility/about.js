const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('about')
        .setDescription('Provides information about the bot.'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('About This Bot')
            .setColor('#0099ff')
            .setDescription('This bot helps manage and track puzzle magazines. Here are some of the features:')
            .addFields(
                { name: 'Non-Admin Commands', value: '\u200B' },
                { name: 'Profile', value: 'Use `/profile` to view your puzzle-solving profile.', inline: true },
                { name: 'Leaderboard', value: 'Use `/leaderboard` to view the top solvers.', inline: true },
                { name: 'List Magazines', value: 'Use `/listmagazines` to list magazines by range.', inline: true },
                { name: 'List Puzzles', value: 'Use `/listpuzzles` to list all puzzles from a specific issue and their status.', inline: true },
                { name: 'Check Answer', value: 'Use `/checkanswer` to check your answer for a puzzle.', inline: true },
                { name: 'List Errata', value: 'Use `/listerrata` to list all errata for a specific magazine and optionally a specific puzzle.', inline: true },
                { name: '\u200B', value: '\u200B' }, // Spacer
                { name: 'Admin Commands', value: '\u200B' },
                { name: 'Add Puzzle', value: 'Use `/addpuzzle` to add new puzzles to the database.', inline: true },
                { name: 'Add Answer', value: 'Use `/addanswer` to add answers to a puzzle.', inline: true },
                { name: 'Add Errata', value: 'Use `/adderrata` to add errata to a puzzle.', inline: true },
                { name: 'Add Keep Going Statement', value: 'Use `/addkeepgoing` to add keep going statements to a puzzle.', inline: true },
                { name: 'Remove Puzzle', value: 'Use `/removepuzzle` to remove a puzzle from the database.', inline: true },
                { name: 'Update Magazine Info', value: 'Use `/updatemagazine` to update magazine information.', inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Puzzle Checker Bot', iconURL: 'https://cdn.alekeagle.me/OR_2_tI56u.jpg' });

        await interaction.reply({ embeds: [embed] });
    },
};
