import type { ParsedDiscordUrl } from './types'

export function parseDiscordUrl(url: string): ParsedDiscordUrl {
  const trimmedUrl = url.trim()

  const serverChannelMessageMatch = trimmedUrl.match(
    /^https?:\/\/(?:www\.)?discord(?:app)?\.com\/channels\/(\d+)\/(\d+)\/(\d+)\/?$/
  )
  if (serverChannelMessageMatch) {
    return {
      isValid: true,
      guildId: serverChannelMessageMatch[1],
      channelId: serverChannelMessageMatch[2],
      messageId: serverChannelMessageMatch[3],
      type: 'message'
    }
  }

  const serverChannelMatch = trimmedUrl.match(
    /^https?:\/\/(?:www\.)?discord(?:app)?\.com\/channels\/(\d+)\/(\d+)\/?$/
  )
  if (serverChannelMatch) {
    return {
      isValid: true,
      guildId: serverChannelMatch[1],
      channelId: serverChannelMatch[2],
      messageId: null,
      type: 'channel'
    }
  }

  const dmMessageMatch = trimmedUrl.match(
    /^https?:\/\/(?:www\.)?discord(?:app)?\.com\/channels\/@me\/(\d+)\/(\d+)\/?$/
  )
  if (dmMessageMatch) {
    return {
      isValid: true,
      guildId: null,
      channelId: dmMessageMatch[1],
      messageId: dmMessageMatch[2],
      type: 'dm'
    }
  }

  const dmChannelMatch = trimmedUrl.match(
    /^https?:\/\/(?:www\.)?discord(?:app)?\.com\/channels\/@me\/(\d+)\/?$/
  )
  if (dmChannelMatch) {
    return {
      isValid: true,
      guildId: null,
      channelId: dmChannelMatch[1],
      messageId: null,
      type: 'dm'
    }
  }

  const isDiscordDomain = /^https?:\/\/(?:www\.)?discord(?:app)?\.com/.test(trimmedUrl) ||
    /^https?:\/\/discord\.gg/.test(trimmedUrl)

  return {
    isValid: isDiscordDomain,
    guildId: null,
    channelId: null,
    messageId: null,
    type: 'unknown'
  }
}

export function isValidDiscordUrl(url: string): boolean {
  return parseDiscordUrl(url).isValid
}

export function getUrlTypeLabel(type: ParsedDiscordUrl['type']): string {
  switch (type) {
    case 'message':
      return 'Message Link'
    case 'channel':
      return 'Channel Link'
    case 'thread':
      return 'Thread Link'
    case 'dm':
      return 'DM Link'
    default:
      return 'Discord Link'
  }
}
