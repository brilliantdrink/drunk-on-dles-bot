// https://github.com/nickdesaulniers/javascript-playlist-parser/blob/master/src/m3u.coffee

// http://gonze.com/playlists/playlist-format-survey.html#M3U

const EXTENDED = '#EXTM3U'
const COMMENT_RE = /:(?:(-?\d+),(.+)\s*-\s*(.+)|(.+))\n(.+)/

interface ExtendedPlaylistItem {
  length: string | number
  artist: string
  title: string
  file: string
}

interface SimplePlaylistItem {
  file: string
}

// #EXTINF:822,Iron Maiden - Rime of the Ancient Mariner
function toExtended(line: string): ExtendedPlaylistItem | undefined {
  const match = line.match(COMMENT_RE)
  if (match && match.length === 6) {
    return {
      length: match[1] || 0,
      artist: match[2] || '',
      title: match[4] || match[3],
      file: match[5].trim()
    }
  }
}

function toSimple(string: string): SimplePlaylistItem {
  return {file: string.trim()}
}

const isEmpty = (line: string) => !!line.trim().length
const isComment = (line: string) => line[0] !== '#'

export default function parseM3U(playlist: string): ExtendedPlaylistItem[] | SimplePlaylistItem[] {
  playlist = playlist.replace(/\r/g, '')
  const firstNewline = playlist.search('\n')
  if (playlist.substring(0, firstNewline) === EXTENDED) {
    return playlist.substring(firstNewline).split('\n#').filter(isEmpty).map(toExtended)
      .filter(l => !!l) as ExtendedPlaylistItem[]
  } else {
    return playlist.split('\n').filter(isEmpty).filter(isComment).map(toSimple)
  }
}
