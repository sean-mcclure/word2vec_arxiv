
# ARXIV DISCOVERY TOOL  
  
The **arXiv Discovery Tool** aids researchers in making discoveries across apparently disparate domains, by mining the latent knowledge in published STEM articles. The application uses [word and document embeddings](https://en.wikipedia.org/wiki/Word_embedding) to retrieve articles that discuss their work in a [similar](https://en.wikipedia.org/wiki/Cosie_similarity) context to a searched term. 

This application was inspired by the Nature [article](https://perssongroup.lbl.gov/papers/dagdelen-2019-word-embeddings.pdf) titled **Unsupervised word embeddings capture latent knowledge from materials science literature**. 

  
## Running the Application  

### Start REST API
  
    node api/scrapre_arxiv.js  
    
### Start web service

    node api/scrape_arxiv.js

 ### Open Browser

    python3 -m http.server

## Support  
  
Please reach out to this project's author for support in running or augmenting the application. For Azle support, please use [Stack Overflow](https://stackoverflow.com/questions/ask?tags=azle%20javascript). 