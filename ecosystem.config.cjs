module.exports = {
    apps: [{
        name: 'bot',
        script: './src/main.ts',
        interpreter_args: '--import tsx',
        instances: 1,
        time: true,
    }]
}
