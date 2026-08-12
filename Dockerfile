ARG REGISTRY
FROM ${REGISTRY}/base/nginx:1.31-alpine

COPY nginx.conf /etc/nginx/nginx.conf
COPY dist/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
