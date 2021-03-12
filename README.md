# fragment_backend

## 部署Heroku

1. 登入heroku
    ```
    heroku login
    ```
2. 與git repo連線
    ```
    heroku git:remote -a limbicfragment
    ```
3. 推
    ```
    git push heroku main
    ```
### 設定環境變數
1. 檢視目前環境變數
    ```
    heroku config
    ```
2. 設定環境變數
    ```
    heroku config:set KEY_NAME=VALUE
    ```