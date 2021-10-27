const gulp = require('gulp');
const cp = require('child_process');
const cached = require("gulp-cached");
const remember = require("gulp-remember");
const debug = require("gulp-debug");
const tsconfig = require('./tsconfig.json');
const ts = require('gulp-typescript');

const compileTypeScript = ts.createProject(tsconfig.compilerOptions);

const sourceAsGlob = "src/**/*.ts";

gulp.task('compile', () => {
	return gulp
		.src(sourceAsGlob)
		.pipe(cached('ts-compile'))
		.pipe(debug({ title: 'comple: ' }))
		.pipe(compileTypeScript())
		.pipe(remember('ts-compile'))
		.pipe(gulp.dest("lib"));
});

gulp.task(
	'watch',
	gulp.series('compile', () => {
		const watcher = gulp.watch(
			sourceAsGlob,
			gulp.series(
				'compile'
			),
		);

		watcher.on('change', function (event) {
			if (event.type === 'deleted') {
				delete cached.caches.scripts[event.path];
				remember.forget('ts-compile', event.path);
			}
		});
	}),
);