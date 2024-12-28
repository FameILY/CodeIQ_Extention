const axios = require('axios');

exports.getUserData = async (id) => {
    try {
        
        const data = await axios.get(`http://localhost:3000/getData/${id}`);
        console.log(data.data.result.name)
        return data.data.result.name
    } catch (error) {
        console.error(error)
        return error.message
    }
}