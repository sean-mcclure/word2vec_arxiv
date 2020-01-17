# ARXIV DISCOVERY TOOL

The arXiv discovery tool helps aid scientific discovery by mining the latent knowledge in published articles.

# MainDirectories and Files
- **api**
- **app**
- **data**
- **logs**
- **node_modules**
- index.html

Core files are kept in the **scripts** directory. These scripts are loaded via Azle's **az.load_scripts** function found in the **index.html** file.

## Running the Application

    node api/scrapre_arxiv.js

## Application Flow

![enter image description here](https://collaboratescience.com/private/mermaid.png)


## Testing

### Unit Testing
The Application is tested using Azle's internal testing framework. To run unit tests open your browser console and do the following:
- az.load_script('tests/tests.js')
- run_tests_window()

## Support

For Azle support, please use [Stack Overflow](https://stackoverflow.com/questions/ask?tags=azle%20javascript). f