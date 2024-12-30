const axios = require('axios');

exports.getUserData = async (id) => {
    try {
        
        const data = await axios.get(`http://localhost:8000/getData/${id}`);
        console.log(data.data.result.email)
        return data.data.result.email
    } catch (error) {
        console.error(error)
        return error.message
    }
}

