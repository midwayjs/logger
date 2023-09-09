import { format } from 'winston';
import { IMidwayLogger } from './interface';
import { ORIGIN_ARGS, ORIGIN_ERROR } from './constant';

function removeProperty(o, p) {
  if (p in o) {
    delete o[p];
  }
}

export const displayCommonMessage = format(
  (
    info,
    opts: {
      defaultLabel?: string;
      defaultMeta?: Record<string, unknown>;
      target?: IMidwayLogger;
    }
  ) => {
    if (!info.pid) {
      info.pid = process.pid;
    }

    if (info[ORIGIN_ERROR as any]) {
      info.originError = info[ORIGIN_ERROR as any];
    }

    if (info[ORIGIN_ARGS as any]) {
      info.originArgs = info[ORIGIN_ARGS as any];
    }

    if (!info.ignoreFormat) {
      info.ignoreFormat = false;
    }

    if (!info.ctx) {
      info.ctx = null;
    }

    if (!info.format) {
      info.format = null;
    }

    if (!info.LEVEL) {
      info.LEVEL = info.level.toUpperCase();
    }

    if (!info.defaultLabel) {
      info.defaultLabel =
        opts.defaultLabel || opts.target?.getDefaultLabel() || '';
    }

    return Object.assign(
      info,
      opts.defaultMeta || opts.target?.getDefaultMeta() || {}
    );
  }
);

function joinLoggerLabel(labelSplit, ...labels) {
  if (labels.length === 0) {
    return '';
  } else {
    const newLabels = labels.filter(label => {
      return !!label;
    });
    if (newLabels.length === 0) {
      return '';
    } else {
      return `[${newLabels.join(labelSplit)}] `;
    }
  }
}

export const displayLabels = format((info, opts) => {
  opts.labelSplit = opts.labelSplit || ':';
  info.labelText = joinLoggerLabel(
    opts.labelSplit,
    info.defaultLabel,
    ...[].concat(info.label)
  );
  return info;
});

export const customJSON = format((info, opts) => {
  const meta = {} as any;
  if (info[ORIGIN_ERROR as any]) {
    meta.originError = info[ORIGIN_ERROR as any];
  }
  removeProperty(info, 'originError');

  if (info[ORIGIN_ARGS as any]) {
    meta.originArgs = info[ORIGIN_ARGS as any];
  }
  removeProperty(info, 'originArgs');

  meta.ignoreFormat = info.ignoreFormat ?? false;
  removeProperty(info, 'ignoreFormat');

  meta.ctx = info.ctx ?? null;
  removeProperty(info, 'ctx');

  // meta.format = info.format ?? null;
  removeProperty(info, 'format');

  meta.LEVEL = info.LEVEL ?? info.level.toUpperCase();
  removeProperty(info, 'LEVEL');
  meta.level = info.level;
  info.level = meta.LEVEL;

  meta.pid = info.pid;
  removeProperty(info, 'pid');

  removeProperty(info, 'label');
  removeProperty(info, 'labelText');
  removeProperty(info, 'defaultLabel');
  const jsonFormat = info.jsonFormat || opts.jsonFormat;
  removeProperty(info, 'jsonFormat');
  if (jsonFormat) {
    return jsonFormat(info, meta) ?? info;
  } else {
    return info;
  }
});
