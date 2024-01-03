const Benchmark = require('benchmark');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);

// 自定义的 formatDate 方法
function formatDate(date) {
  function pad(num, size = 2) {
    const s = num + '';
    return s.padStart(size, '0');
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  const millisecond = date.getMilliseconds();

  return `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}:${pad(
    second
  )}.${pad(millisecond, 3)}`;
}

function formatDateWithCustomPad(date) {
  function pad(num, size = 2) {
    let s = num.toString();
    while (s.length < size) s = '0' + s;
    return s;
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  const millisecond = date.getMilliseconds();

  return `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}:${pad(
    second
  )}.${pad(millisecond, 3)}`;
}

// 创建一个 benchmark 套件
const suite = new Benchmark.Suite();

// 添加测试
suite
  // .add('dayjs#getFormatDate', function() {
  //   dayjs().format('YYYY-MM-DD HH:mm:ss.SSS');
  // })
  .add('custom#formatDate', () => {
    formatDate(new Date());
  })
  .add('custom#formatDateWithCustomPad', () => {
    formatDateWithCustomPad(new Date());
  })
  // 添加事件监听器
  .on('cycle', event => {
    console.log(String(event.target));
  })
  .on('complete', function () {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  // 运行测试
  .run({ async: true });
