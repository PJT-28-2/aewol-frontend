let sessionEpoch = 0

export function beginSessionTask() {
  return sessionEpoch
}

export function bumpSessionEpoch() {
  sessionEpoch += 1
  return sessionEpoch
}

export function isCurrentSession(epoch) {
  return epoch === sessionEpoch
}
