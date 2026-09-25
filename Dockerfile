FROM nginx:alpine
COPY default.conf /etc/nginx/conf.d/default.conf
COPY index.html style.css app.js config.js /usr/share/nginx/html/
EXPOSE 8080
