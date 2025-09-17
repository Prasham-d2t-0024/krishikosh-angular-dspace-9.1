const fs = require('fs');
const path = require('path');
const targetFilePath = '../themes/dspace/styles/_theme_sass_variable_overrides.scss'
const themeConfigPath = './theme-config.json';

// Function to update only specific variables while preserving file structure
function updateScssVariables(outputPath, generatedVariables) {
    let existingContent = '';

    // Read existing file if it exists
    if (fs.existsSync(outputPath)) {
        existingContent = fs.readFileSync(outputPath, 'utf8');
    }

    if (!existingContent.trim()) {
        // File doesn't exist or is empty - create new file with generated content
        const newContent = `// Auto-generated theme variables from theme-config.json
        // Last updated: ${new Date().toISOString()}

        /*** BOOTSTRAP THEME COLORS ***/
        ${Object.entries(generatedVariables.bootstrap_colors).map(([key, value]) =>
                `$${key.replace(/_/g, '-')}: ${value};`
            ).join('\n')}

        // Add new semantic colors here (you don't need to add existing semantic colors)
        $theme-custom-semantic-colors: (
        );

        /*** OTHER BOOTSTRAP VARIABLES ***/

        ${Object.entries(generatedVariables.other_bootstrap).map(([key, value]) => {
                const varName = key.replace(/_/g, '-');
                if (key === 'min_contrast_ratio') {
                    return `$${varName}: ${value} !default;`;
                } else {
                    return `$${varName}: ${value};`;
                }
            }).join('\n')}
        $link-hover-decoration: underline;

        /*** CUSTOM DSPACE VARIABLES ***/

        ${Object.entries(generatedVariables.dspace_custom).map(([key, value]) => {
            const varName = key.replace(/_/g, '-');
            if (key === 'ds_breadcrumb_link_active_color') {
                return `$${varName}: darken($light, 26.93%) !default;`;
            } else if(key === 'ds_breadcrumb_link_active_color') {
                return `$${varName}: $light !default;`;
            }else{
                return `$${varName}: ${value};`;
            }
        }).join('\n')}`;
        fs.writeFileSync(outputPath, newContent);
        console.log('Created new SCSS file with generated variables');
        return;
    }

    // Update existing file - preserve structure and only update specific variables
    let updatedContent = existingContent;

    // Update timestamp if it exists
    const timestampRegex = /\/\/ Last updated: .*/;
    if (timestampRegex.test(updatedContent)) {
        updatedContent = updatedContent.replace(timestampRegex, `// Last updated: ${new Date().toISOString()}`);
    }

    // Function to update a specific variable while preserving comments and structure
    function updateVariable(content, varName, newValue, isDefault = false) {
        const defaultSuffix = isDefault ? ' !default' : '';
        const escapedVarName = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Pattern to match the variable declaration (with or without !default)
        // Capture: (prefix)(value)(suffix with semicolon)(rest of line)
        const varPattern = new RegExp(`^(\\s*\\$${escapedVarName}\\s*:\\s*)[^;\\n]+(\\s*(?:!default)?\\s*)(;.*)$`, 'gm');

        if (varPattern.test(content)) {
            return content.replace(varPattern, `$1${newValue}${defaultSuffix}$3`);
        }
        return content;
    }

    // Update Bootstrap theme colors
    Object.entries(generatedVariables.bootstrap_colors).forEach(([key, value]) => {
        const varName = key.replace(/_/g, '-');
        updatedContent = updateVariable(updatedContent, varName, value);
    });

    // Update other Bootstrap variables
    Object.entries(generatedVariables.other_bootstrap).forEach(([key, value]) => {
        const varName = key.replace(/_/g, '-');
        const isDefault = key === 'min_contrast_ratio';
        updatedContent = updateVariable(updatedContent, varName, value, isDefault);
    });

    updatedContent = updateVariable(updatedContent, 'link-hover-decoration', 'underline');

    // Update DSpace custom variables
    // Object.entries(generatedVariables.dspace_custom).forEach(([key, value]) => {
    //     const varName = key.replace(/_/g, '-');
    //     if (key === 'ds_breadcrumb_link_active_color' && value === '#ffffff') {
    //         updatedContent = updateVariable(updatedContent, varName, '$light', true);
    //     } else {
    //         updatedContent = updateVariable(updatedContent, varName, value);
    //     }
    // });

    // Write the updated content back to file
    fs.writeFileSync(outputPath, updatedContent);
    console.log('Updated existing SCSS file, preserving structure and custom content');
}

try {
    // Read the JSON configuration
    const configPath = path.join(__dirname, themeConfigPath);
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // Update the SCSS file preserving existing content and structure
    const outputPath = path.join(__dirname, targetFilePath);

    // Ensure directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    updateScssVariables(outputPath, config);
    console.log(`Theme SASS File updated at path: ${outputPath}`);

} catch (error) {
    console.error('Error updating theme variables:', error.message);
    process.exit(1);
}