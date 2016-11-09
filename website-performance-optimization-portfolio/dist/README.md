## Website Performance Optimization portfolio project

### FOR PART 1: Critical Rendering Path Specification

I have hosted the files on github. you can use below urls to test performance
[Link to Part 1](https://melvinmonteiro.github.io/website-performance-optimization-portfolio/dist/index.html)
[Link to Pagespeed Insights] (https://developers.google.com/speed/pagespeed/insights/?url=https%3A%2F%2Fmelvinmonteiro.github.io%2Fwebsite-performance-optimization-portfolio%2Fdist%2Findex.html&tab=mobile)

Code repository is [here] (https://github.com/melvinmonteiro/melvinmonteiro.github.io/tree/master/website-performance-optimization-portfolio)

##SOLUTION
**Added and minified inline css
**Moved non-critical js to the bottom
**compressed large images

### FOR PART 2: Frame Rate & Computational Efficiency Specification

use link [here] (https://melvinmonteiro.github.io/website-performance-optimization-portfolio/dist/views/pizza.html)

Code repository is [here] (https://github.com/melvinmonteiro/melvinmonteiro.github.io/tree/master/website-performance-optimization-portfolio)

##SOLUTION

**Removed usage of queryAllSelectors and instead used getElementsById or getElementsByClassName
**Only generate the pizza's that in visible in the viewport
**use a css attribute transform on .mover so that CSS3 transformation will boost performance during painting process
**remove redundant code from for loops

#NOTES
I have used manual tools for compressing images and minifying js as they are very few
