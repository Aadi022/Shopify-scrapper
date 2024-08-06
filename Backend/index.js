const express= require("express");
const axios= require("axios");
const cheerio= require("cheerio");
const bodyParser= require("body-parser");
const app=express();
app.use(bodyParser.json());
app.use(express.json());

const port= 3000;

app.post("/scrape",async function(req,res){
    const url= req.body.url;

    try{
        if (!url) {
            throw new Error("URL is required");
        }

        const parsedUrl = new URL(url); // Parse the URL
        const finalurl = `${parsedUrl.origin}/sitemap.xml`; // Construct the sitemap URL

        const sitemapResponse = await axios.get(finalurl);

        const loaded_firstsite= cheerio.load(sitemapResponse.data, {xmlMode:true}); //Now scraping the sitemapResponse
        const sitemapUrl= loaded_firstsite('sitemapindex > sitemap > loc').first().text();  //So this goes in loc, which is in sitemap, which is in sitemapindex. It goes in the first such loc found and converts it to plain string
        
        //Given the sitemapUrl, we now axios get then scrape it
        const productSitemapResponse= await axios.get(sitemapUrl);
        const loaded_secsitemap= cheerio.load(productSitemapResponse.data, {xmlMode: true});

        const productdata= loaded_secsitemap('url').map((i,el)=>{  //Wherever there is a <url> tag in loaded_secsitemap, map function will be called. Also, i is the current index and el is the current element.
            const loc= loaded_secsitemap(el).find('loc').text();  //finds, stores and converts to plain string all the <loc> tagged link.
            const imageLoc= loaded_secsitemap(el).find('image\\:loc').text();  //finds, stores and converts to plain string all the <image:loc> tagged link.
            const imageTitle= loaded_secsitemap(el).find('image\\:title').text();  //finds, stores and converts to plain string all the <image:title> tagged link.

            if(imageLoc && imageTitle){
                return { loc, imageLoc, imageTitle};
            }
        }).get().filter(Boolean);  //filters out undefined values

        const results=[];
        for(const product of productdata){ 
            const {loc,imageLoc,imageTitle}=product;
            const productResponse= await axios.get(loc); 
            const loaded_thirdsitemap= cheerio.load(productResponse.data); //Scraping the main link where all the data is there
            let content = loaded_thirdsitemap('body').text(); //Picking the <body> section from the scraped result

            const regex = /\([^)]*\)|\{[^}]*\}/g;
            const text = content.replace(regex, '');
            console.log(text);

            const summaryResponse= await axios.post('https://api.openai.com/v1/completions',{ //Passing in the openai api
                prompt: content,  
                max_tokens: 100,
                n:1,
                stop:null,
                temperature: 0.7 //This is basically how creative the renewed content be. The creativity increases as you move from 0 to 1
            },{
                headers:{
                    'Authorization': `Bearer my_api_key`
                }
            });

            const points= summaryResponse.data.choices[0].text.trim().split('/n');

            results.push({   //Finally pushing the updated stuff in results array. It will be an array of json
                url:loc,
                title:imageTitle,
                imageUrl: imageLoc,
                points
            });
        }
        res.status(200).json({
            result: results
        });
    }
    catch(error){
        console.log(error);
        res.status(500)
    }
})




app.listen(3000,function(){
    console.log("The server is running on port number ",port);
})
