import { describe, test, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { compressStackTrace } from '../../utils/stackTraceCompressor';

describe('Stack Trace Compressor', () => {

  describe('Basic Edge Cases', () => {
    it('1. should return original if falsy (undefined)', () => {
      expect(compressStackTrace(undefined as any)).toBeUndefined();
    });

    it('2. should return original if falsy (null)', () => {
      expect(compressStackTrace(null as any)).toBeNull();
    });

    it('3. should return original if falsy (empty string)', () => {
      expect(compressStackTrace('')).toBe('');
    });

    it('4. should return original if not a string (number)', () => {
      expect(compressStackTrace(123 as any)).toBe(123);
    });

    it('5. should return original if not a string (object)', () => {
      const obj = { foo: 'bar' };
      expect(compressStackTrace(obj as any)).toBe(obj);
    });
  });

  describe('Short Stack Traces (Under or Equal to maxFrames)', () => {
    const shortStack = `Error: something bad
    at foo (app.js:10)
    at bar (app.js:20)`;

    it('6. should leave short stacks completely intact', () => {
      expect(compressStackTrace(shortStack)).toBe(shortStack);
    });

    it('7. should not add the omission marker for short stacks', () => {
      expect(compressStackTrace(shortStack)).not.toContain('omitted');
    });

    it('8. should respect custom maxFrames even if standard is higher', () => {
      // 2 frames + 1 header = 3 lines total. 
      // If maxFrames = 1, it should compress it.
      const result = compressStackTrace(shortStack, { maxFrames: 1 });
      expect(result).toContain('omitted');
    });

    it('9. should handle exactly maxFrames without compression (default 5)', () => {
      const exactStack = `Error: exact
    1
    2
    3
    4
    5`;
      expect(compressStackTrace(exactStack)).toBe(exactStack);
      expect(compressStackTrace(exactStack)).not.toContain('omitted');
    });
  });

  describe('Long Stack Traces (Over maxFrames) - App Priority', () => {
    const mixedStack = `Error: crash
    at emit (node:events:514:28)
    at process.processTicksAndRejections (node:internal/process/task_queues:83:21)
    at module.exports (/app/node_modules/express/lib/router/index.js:281:22)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at next (/app/node_modules/express/lib/router/route.js:144:13)
    at Route.dispatch (/app/node_modules/express/lib/router/route.js:114:3)
    at myAppFunction (/app/src/controller.js:42:10)
    at anotherAppFunction (/app/src/service.js:15:2)
    at deeplyNestedAppFunction (/app/src/repository.js:99:1)`;

    it('10. should prioritize app frames over node_modules frames', () => {
      const compressed = compressStackTrace(mixedStack);
      expect(compressed).toContain('myAppFunction');
      expect(compressed).toContain('anotherAppFunction');
      expect(compressed).toContain('deeplyNestedAppFunction');
    });

    it('11. should filter out node_modules from the top frames', () => {
      const compressed = compressStackTrace(mixedStack);
      expect(compressed).not.toContain('express/lib/router/route.js');
    });

    it('12. should filter out internal node functions', () => {
      const compressed = compressStackTrace(mixedStack);
      expect(compressed).not.toContain('node:internal/process/task_queues');
    });

    it('13. should include the original error header', () => {
      const compressed = compressStackTrace(mixedStack);
      expect(compressed.startsWith('Error: crash')).toBe(true);
    });

    it('14. should include the omission marker showing how many frames were dropped', () => {
      const compressed = compressStackTrace(mixedStack);
      expect(compressed).toContain('5 frames omitted');
    });

    it('15. should cap app frames if there are more app frames than maxFrames', () => {
      let longAppStack = 'Error: huge\n';
      for (let i = 0; i < 10; i++) {
        longAppStack += `    at appFunc${i} (/app/src/file.js:1:1)\n`;
      }
      
      const compressed = compressStackTrace(longAppStack);
      // maxFrames is 5 by default
      expect(compressed).toContain('appFunc0');
      expect(compressed).toContain('appFunc4');
      expect(compressed).not.toContain('appFunc5'); // The 6th frame
      expect(compressed).toContain('6 frames omitted');
    });
  });

  describe('Long Stack Traces - No App Frames', () => {
    const vendorStack = `Error: vendor crash
    at v1 (/app/node_modules/lib/1.js)
    at v2 (/app/node_modules/lib/2.js)
    at v3 (/app/node_modules/lib/3.js)
    at v4 (/app/node_modules/lib/4.js)
    at v5 (/app/node_modules/lib/5.js)
    at v6 (/app/node_modules/lib/6.js)
    at v7 (/app/node_modules/lib/7.js)`;

    it('16. should fall back to taking the top raw frames if no app frames exist', () => {
      const compressed = compressStackTrace(vendorStack);
      expect(compressed).toContain('v1');
      expect(compressed).toContain('v5'); // The 5th frame
      expect(compressed).not.toContain('v6');
    });

    it('17. should include the omission marker for all-vendor stacks', () => {
      const compressed = compressStackTrace(vendorStack);
      expect(compressed).toContain('2 frames omitted');
    });

    it('18. should limit fallback frames strictly to maxFrames', () => {
      const compressed = compressStackTrace(vendorStack, { maxFrames: 3 });
      expect(compressed).toContain('v1');
      expect(compressed).toContain('v3');
      expect(compressed).not.toContain('v4');
      expect(compressed).toContain('4 frames omitted'); // 7 total frames, kept 3
    });
  });

  describe('Special Cases & Formats', () => {
    it('19. should handle single-line inputs without failing', () => {
      const single = "Error: no stack at all";
      expect(compressStackTrace(single)).toBe(single);
    });

    it('20. should handle very large maxFrames gracefully', () => {
      const stack = "Error\n  at 1\n  at 2\n  at 3";
      expect(compressStackTrace(stack, { maxFrames: 1000 })).toBe(stack);
    });

    it('21. should handle maxFrames=0 by omitting all frames (if supported)', () => {
      // By implementation, maxFrames = options?.maxFrames || 5.
      // So if maxFrames is 0, it becomes 5.
      // Let's verify this behavior (falling back to default).
      const stack = "Error\n  at 1\n  at 2\n  at 3\n  at 4\n  at 5\n  at 6";
      const result = compressStackTrace(stack, { maxFrames: 0 });
      // Because 0 is falsy, it defaults to 5. So 1 frame is omitted.
      expect(result).toContain('1 frames omitted');
    });

    it('22. should handle missing node_modules or internal in a pure app stack', () => {
      const appOnly = `Error
    at a
    at b
    at c
    at d
    at e
    at f`;
      const result = compressStackTrace(appOnly);
      expect(result).toContain('a');
      expect(result).not.toContain('at f');
      expect(result).toContain('1 frames omitted');
    });

    it('23. should handle strings that just happen to contain the word "node_modules" in the error header', () => {
      // The header is split off before filtering
      const confusing = `Error: cannot find node_modules folder
    at a
    at b
    at c
    at d
    at e
    at f`;
      const result = compressStackTrace(confusing);
      expect(result.startsWith('Error: cannot find node_modules folder')).toBe(true);
      expect(result).toContain('1 frames omitted');
    });

    it('24. should not drop internal frames if they are the ONLY frames', () => {
      const internal = `Error
    at node:internal/process/a
    at node:internal/process/b
    at node:internal/process/c
    at node:internal/process/d
    at node:internal/process/e
    at node:internal/process/f`;
      const result = compressStackTrace(internal);
      expect(result).toContain('process/a');
      expect(result).not.toContain('process/f');
    });

    it('25. should handle unusual whitespace gracefully', () => {
      const weird = `Error\n\n\n  at a\n\n  at b\n\n  at c\n\n\n\n  at d\n  at e\n  at f`;
      const result = compressStackTrace(weird);
      // It splits by \n, so empty lines count as frames. 
      // It should still omit some lines without crashing.
      expect(result).toContain('omitted');
    });
  });

});
