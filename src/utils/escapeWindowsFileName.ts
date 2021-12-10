const escapeMap: Record<string, string> = {
  '\\': '﹨',
  '/': '╱',
  ':': '：',
  '*': '＊',
  '?': '？',
  '<': '﹤',
  '>': '＞',
  '|': '丨',
}

export default function escapeWindowsFileName(fileName: string) {
  return fileName.split('').map(item => escapeMap[item] ?? item).join('')
}
