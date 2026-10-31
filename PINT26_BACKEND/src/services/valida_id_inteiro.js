function validaIDInteiro(id) {

  const idInt = parseInt(id, 10);

  if (isNaN(idInt) || idInt <= 0) {
    return null;
  }

  return idInt;

}

module.exports = validaIDInteiro;