import React, { useState } from "react";
import axios from "axios";
import "./MyComponent.css";

function MyComponent() {
    const [domain, setDomain] = useState("");

    const handleDomainChange = (event) => {
        setDomain(event.target.value);
    };

    const handleButtonClick = async () => {
        try {
            const response = await axios.post("http://localhost:3000/scrape", {
                url: domain
            });
        } catch (error) {
            alert("Error in fetching from server");
        }
    };

    return (
        <div className="my-component">
            <h1>Welcome to Shopify Scraper</h1>
            <h3>Domain Name</h3>
            <input className="input-box" type="text" placeholder="Enter domain name" value={domain}onChange={handleDomainChange}></input>
            <button className="scrape-button" onClick={handleButtonClick}>
                Start Scraping
            </button>
            <div className="cards-container">
                <div className="card" onClick={() => console.log("Card 1 clicked")}></div>
                <div className="card" onClick={() => console.log("Card 2 clicked")}></div>
                <div className="card" onClick={() => console.log("Card 3 clicked")}></div>
            </div>
        </div>
    );
}

export default MyComponent;
