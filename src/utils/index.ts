/**
 * 将 aaa-bbb-ccc 格式字符串转为
 * 驼峰式命名法的字符串 AaaBbbCcc
 *
 * @param lowerCaseStart 以小写字母开头, 即小驼峰命名法
 */
export function getCamelCaseName(name: string, lowerCaseStart: boolean = false) {
	return name
		.split('-')
		.filter((str) => str.length > 0)
		.map((part, index) => {
			const firstLetter = index == 0 && lowerCaseStart ? part[0].toLowerCase() : part[0].toUpperCase();
			return firstLetter + part.slice(1);
		})
		.join('');
}
