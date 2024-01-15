const path = require("path");

module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "firchart.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
    ],
  },
  devServer: {
    static: {
      directory: path.join(__dirname),
      publicPath: "/",
    },
    compress: true,
    port: 3000,
    host: "0.0.0.0",
    allowedHosts: "all",
    open: false,
    historyApiFallback: {
      index: "example.html", // Fallback to example.html
    },
  },
};
