'use strict';

const fs = require('fs');
const axios = require('axios').default;

async function ProcessImage(blob_data) {
    // Add a valid subscription key and endpoint to your environment variables.
    let subscriptionKey = '21361c93eb0b43318d12f4b4da2b28cd';
    let endpoint = 'https://cscapstonepaid.cognitiveservices.azure.com/' + '/face/v1.0/detect';

    // Optionally, replace with your own image URL (for example a .jpg or .png URL).
    // let imageUrl = "https://docs.microsoft.com/en-us/learn/data-ai-cert/identify-faces-with-computer-vision/media/clo19_ubisoft_azure_068.png"
    
    
    // Send a POST request
    return await axios({
        method: 'post',
        url: endpoint,
        headers : {
            'Content-Type' : 'application/octet-stream',
            'Ocp-Apim-Subscription-Key': subscriptionKey
        },
        params : {
            detectionModel: 'detection_01',
            returnFaceAttributes: 'emotion',
            returnFaceId: true
        },
        data: blob_data

    }).then(function (response) {
        let prediction, max_val = 0;

        if(response.data[0] != null) {
            for(const [key, value] of Object.entries(response.data[0].faceAttributes.emotion)) {
                if(value > max_val) {
                    max_val = value;
                    prediction = key;
                }
            }
    
            if(prediction == "contempt")    {
                prediction = "disgust";
            }
    
            return prediction;
        }
        else {
            console.log("Face not detected");
            return undefined;
        }
        
    }).catch(function (error) {
        console.log(error)
        return error;
    });
}

module.exports = { ProcessImage };