const path = require("path");
const packageJson = require("./package.json");

module.exports = {
  entry: "./src/index.ts",
  target: "node",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: packageJson.name + "-" + packageJson.version + ".js",
    path: path.resolve(__dirname, "dist"),
  },
};
