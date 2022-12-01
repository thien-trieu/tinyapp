// returns undefined if user does not exist, returns user object if found.
const getUserByEmail = (email, database) => {
  let result = undefined
  for (let ids in database){
    if (email === database[ids].email) {
      result = database[ids]
    } 
  }
  return result
}

module.exports = { getUserByEmail };