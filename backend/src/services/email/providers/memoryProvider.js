/**
 * Provider Memory: menyimpan email dalam memori untuk keperluan pengujian otomatis.
 * Mendukung injeksi skenario hasil (sukses, retryable, permanent) per pemanggilan.
 */

function createMemoryProvider() {
  const sentEmails = [];
  const resultQueue = [];
  let defaultResult = null;

  async function sendEmail(params) {
    let result = null;

    if (resultQueue.length > 0) {
      result = resultQueue.shift();
    } else if (defaultResult) {
      result = defaultResult;
    } else {
      result = {
        success: true,
        messageId: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      };
    }

    sentEmails.push({
      ...params,
      sentAt: new Date(),
      result,
    });

    return result;
  }

  function queueResult(res) {
    resultQueue.push(res);
  }

  function setDefaultResult(res) {
    defaultResult = res;
  }

  function getSentEmails() {
    return [...sentEmails];
  }

  function clear() {
    sentEmails.length = 0;
    resultQueue.length = 0;
    defaultResult = null;
  }

  return {
    name: 'memory',
    sendEmail,
    queueResult,
    setDefaultResult,
    getSentEmails,
    clear,
  };
}

module.exports = {
  createMemoryProvider,
};

