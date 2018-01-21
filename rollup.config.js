import typescript from 'rollup-plugin-typescript2';
import commonjs from 'rollup-plugin-commonjs';


export default {
    entry: './index.ts',
    external: ['three'],
    output: [{
        file: './dist/argraph.js',
        format: 'umd',
        name: 'three-ar',
    }],
    globals: {
        three: 'THREE'
    },
    plugins: [
        commonjs({
            namedExports: {
                // left-hand side can be an absolute path, a path
                // relative to the current directory, or the name
                // of a module in node_modules
                'node_modules/colormap/index.js': ['createColormap']
            }
        }),
        typescript({
            rollupCommonJSResolveHack: true,
            typescript: require('typescript')
        })
    ]
};