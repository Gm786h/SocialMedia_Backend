const MAX_LIMIT = 100;

function toPositiveInt(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

function getPagination(query, defaultLimit = 10) {
  const page = toPositiveInt(query.page, 1);
  const limit = Math.min(toPositiveInt(query.limit, defaultLimit), MAX_LIMIT);
  return { page, limit, offset: (page - 1) * limit };
}

module.exports = { getPagination, toPositiveInt };
