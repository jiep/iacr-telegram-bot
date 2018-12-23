const osmosis = require('osmosis')
const Bluebird = require('bluebird')
const Telegraf = require('telegraf')

const { TELEGRAM_TOKEN } = process.env

if(!TELEGRAM_TOKEN){
  console.log('TELEGRAM_TOKEN not found!')
  process.exit(1)
}

const bot = new Telegraf(TELEGRAM_TOKEN)

bot.command('papers', (ctx) => {
  getLastWeekPapers()
    .then(({papers}) => {
      papers.map(format).forEach(p => ctx.replyWithMarkdown(p))
    })
})

bot.startPolling()

const format = (paper) => {
  const { title, authors, link } = paper
  const link_url = link.startsWith('/') ? `https://eprint.iacr.org${link}` : link
  return `
💡 *Title*: ${title}
👥 *Authors*: ${authors}
🔗 *Link*: ${link_url}
  `
}

const getLastWeekPapers = () => {
  const url = 'https://eprint.iacr.org/eprint-bin/search.pl?last=7&title=1'

  return new Bluebird((resolve, reject) => {
    osmosis
      .get(url)
      .set({
        'papers': [
          osmosis
            .find('body > dl > dt > a:nth-child(1)')
            .follow('@href')
            .find('body')
            .set({
              'title': 'b',
              'authors': 'i',
              'link': 'a@href'
            })
        ]
      })
      .data((listing) => resolve(listing))
  })
}
