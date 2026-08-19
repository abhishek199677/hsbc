/**
 * Pre-defined coding challenge questions for the AI interview.
 *
 * Challenges are categorized by language and difficulty.
 * The AI selects an appropriate challenge based on the candidate's
 * role, experience level, and current difficulty.
 */

import type { ChallengeQuestion } from "./sandbox";

export const challenges: ChallengeQuestion[] = [
  // ─── JavaScript ────────────────────────────────────────────
  {
    id: "js-two-sum",
    title: "Two Sum",
    description: `Given an array of integers \`nums\` and an integer \`target\`, return the indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

Return the answer in any order.`,
    difficulty: "easy",
    language: "javascript",
    starterCode: `function twoSum(nums, target) {
  // Write your solution here
  // Return an array of two indices
}`,
    testCases: [
      { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]" },
      { input: "[3,2,4]\n6", expectedOutput: "[1,2]" },
      { input: "[3,3]\n6", expectedOutput: "[0,1]" },
      { input: "[1,5,3,7,2]\n9", expectedOutput: "[1,3]" },
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists.",
    ],
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
      },
    ],
    timeLimit: 300,
  },
  {
    id: "js-valid-parentheses",
    title: "Valid Parentheses",
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    difficulty: "easy",
    language: "javascript",
    starterCode: `function isValid(s) {
  // Write your solution here
  // Return true if valid, false otherwise
}`,
    testCases: [
      { input: "()", expectedOutput: "true" },
      { input: "()[]{}", expectedOutput: "true" },
      { input: "(]", expectedOutput: "false" },
      { input: "([)]", expectedOutput: "false" },
      { input: "{[]}", expectedOutput: "true" },
    ],
    constraints: [
      "1 <= s.length <= 10^4",
      "s consists of parentheses only '()[]{}'.",
    ],
    examples: [
      {
        input: 's = "()"',
        output: "true",
        explanation: "The parentheses are properly nested.",
      },
    ],
    timeLimit: 300,
  },
  {
    id: "js-fizzbuzz",
    title: "FizzBuzz",
    description: `Given an integer \`n\`, return a string array \`answer\` (1-indexed) where:

- \`answer[i] == "FizzBuzz"\` if \`i\` is divisible by 3 and 5.
- \`answer[i] == "Fizz"\` if \`i\` is divisible by 3.
- \`answer[i] == "Buzz"\` if \`i\` is divisible by 5.
- \`answer[i] == i'\` (as a string) if none of the above conditions are true.`,
    difficulty: "easy",
    language: "javascript",
    starterCode: `function fizzBuzz(n) {
  // Write your solution here
  // Return an array of strings
}`,
    testCases: [
      { input: "5", expectedOutput: '["1","2","Fizz","4","Buzz"]' },
      { input: "15", expectedOutput: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]' },
    ],
    constraints: ["1 <= n <= 10^4"],
    examples: [
      {
        input: "n = 5",
        output: '["1","2","Fizz","4","Buzz"]',
        explanation: "FizzBuzz for numbers 1 through 5.",
      },
    ],
    timeLimit: 180,
  },
  {
    id: "js-max-subarray",
    title: "Maximum Subarray",
    description: `Given an integer array \`nums\`, find the subarray with the largest sum, and return its sum.

A subarray is a contiguous non-empty sequence of elements within an array.`,
    difficulty: "medium",
    language: "javascript",
    starterCode: `function maxSubArray(nums) {
  // Write your solution here
  // Return the maximum sum
}`,
    testCases: [
      { input: "[-2,1,-3,4,-1,2,1,-5,4]", expectedOutput: "6" },
      { input: "[1]", expectedOutput: "1" },
      { input: "[5,4,-1,7,8]", expectedOutput: "23" },
    ],
    constraints: [
      "1 <= nums.length <= 10^5",
      "-10^4 <= nums[i] <= 10^4",
    ],
    examples: [
      {
        input: "nums = [-2,1,-3,4,-1,2,1,-5,4]",
        output: "6",
        explanation: "The subarray [4,-1,2,1] has the largest sum 6.",
      },
    ],
    timeLimit: 300,
  },
  {
    id: "js-lru-cache",
    title: "LRU Cache",
    description: `Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.

Implement the \`LRUCache\` class:
- \`LRUCache(int capacity)\` Initialize the LRU cache with positive size capacity.
- \`int get(int key)\` Return the value of the key if the key exists, otherwise return -1.
- \`void put(int key, int value)\` Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity, evict the least recently used key.

The functions \`get\` and \`put\` must each run in O(1) average time complexity.`,
    difficulty: "hard",
    language: "javascript",
    starterCode: `class LRUCache {
  constructor(capacity) {
    // Initialize your data structure here
  }

  get(key) {
    // Return value or -1
  }

  put(key, value) {
    // Insert or update
  }
}`,
    testCases: [
      {
        input: '["LRUCache","put","put","get","put","get","put","get","get","get"]\n[[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]',
        expectedOutput: "[null,null,null,1,null,-1,null,-1,3,4]",
      },
    ],
    constraints: [
      "1 <= capacity <= 3000",
      "0 <= key <= 10^4",
      "0 <= value <= 10^5",
      "At most 2 * 10^5 calls will be made to get and put.",
    ],
    examples: [
      {
        input: '["LRUCache","put","put","get","put","get","put","get","get","get"]\n[[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]',
        output: "[null,null,null,1,null,-1,null,-1,3,4]",
        explanation: "LRUCache lRUCache = new LRUCache(2); lRUCache.put(1, 1); lRUCache.put(2, 2); lRUCache.get(1); lRUCache.put(3, 3); lRUCache.get(2); lRUCache.put(4, 4); lRUCache.get(1); lRUCache.get(3); lRUCache.get(4);",
      },
    ],
    timeLimit: 600,
  },

  // ─── Python ────────────────────────────────────────────────
  {
    id: "py-two-sum",
    title: "Two Sum",
    description: `Given an array of integers \`nums\` and an integer \`target\`, return the indices of the two numbers such that they add up to \`target\`.

Return the answer as a list of two indices (0-indexed).`,
    difficulty: "easy",
    language: "python",
    starterCode: `def two_sum(nums, target):
    # Write your solution here
    # Return a list of two indices
    pass`,
    testCases: [
      { input: "[2,7,11,15]\n9", expectedOutput: "[0, 1]" },
      { input: "[3,2,4]\n6", expectedOutput: "[1, 2]" },
      { input: "[3,3]\n6", expectedOutput: "[0, 1]" },
    ],
    constraints: [
      "2 <= len(nums) <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
    ],
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
      },
    ],
    timeLimit: 300,
  },
  {
    id: "py-fibonacci",
    title: "Fibonacci Number",
    description: `The Fibonacci numbers, commonly denoted \`F(n)\`, form a sequence called the Fibonacci sequence, such that each number is the sum of the two preceding ones, starting from 0 and 1.

Given \`n\`, calculate \`F(n)\`.

- F(0) = 0, F(1) = 1
- F(n) = F(n - 1) + F(n - 2), for n > 1`,
    difficulty: "easy",
    language: "python",
    starterCode: `def fibonacci(n):
    # Write your solution here
    pass`,
    testCases: [
      { input: "2", expectedOutput: "1" },
      { input: "3", expectedOutput: "2" },
      { input: "4", expectedOutput: "3" },
      { input: "10", expectedOutput: "55" },
    ],
    constraints: ["0 <= n <= 30"],
    examples: [
      {
        input: "n = 4",
        output: "3",
        explanation: "F(4) = F(3) + F(2) = 2 + 1 = 3.",
      },
    ],
    timeLimit: 180,
  },
  {
    id: "py-palindrome",
    title: "Valid Palindrome",
    description: `A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.

Given a string \`s\`, return \`True\` if it is a palindrome, or \`False\` otherwise.`,
    difficulty: "easy",
    language: "python",
    starterCode: `def is_palindrome(s):
    # Write your solution here
    # Return True or False
    pass`,
    testCases: [
      { input: "A man, a plan, a canal: Panama", expectedOutput: "True" },
      { input: "race a car", expectedOutput: "False" },
      { input: " ", expectedOutput: "True" },
    ],
    constraints: [
      "1 <= s.length <= 2 * 10^5",
      "s consists only of printable ASCII characters.",
    ],
    examples: [
      {
        input: 's = "A man, a plan, a canal: Panama"',
        output: "True",
        explanation: '"amanaplanacanalpanama" is a palindrome.',
      },
    ],
    timeLimit: 300,
  },
  {
    id: "py-merge-intervals",
    title: "Merge Intervals",
    description: `Given an array of \`intervals\` where \`intervals[i] = [start_i, end_i]\`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.`,
    difficulty: "medium",
    language: "python",
    starterCode: `def merge(intervals):
    # Write your solution here
    # Return list of merged intervals
    pass`,
    testCases: [
      { input: "[[1,3],[2,6],[8,10],[15,18]]", expectedOutput: "[[1,6],[8,10],[15,18]]" },
      { input: "[[1,4],[4,5]]", expectedOutput: "[[1,5]]" },
    ],
    constraints: [
      "1 <= intervals.length <= 10^4",
      "intervals[i].length == 2",
      "0 <= start_i <= end_i <= 10^4",
    ],
    examples: [
      {
        input: "intervals = [[1,3],[2,6],[8,10],[15,18]]",
        output: "[[1,6],[8,10],[15,18]]",
        explanation: "Since intervals [1,3] and [2,6] overlap, merge them into [1,6].",
      },
    ],
    timeLimit: 300,
  },
  {
    id: "py-bin-tree-levels",
    title: "Binary Tree Level Order Traversal",
    description: `Given the \`root\` of a binary tree, return the level order traversal of its nodes' values (i.e., from left to right, level by level).`,
    difficulty: "medium",
    language: "python",
    starterCode: `# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right

def level_order(root):
    # Write your solution here
    # Return list of lists
    pass`,
    testCases: [
      { input: "[3,9,20,null,null,15,7]", expectedOutput: "[[3],[9,20],[15,7]]" },
      { input: "[1]", expectedOutput: "[[1]]" },
      { input: "[]", expectedOutput: "[]" },
    ],
    constraints: [
      "The number of nodes in the tree is in the range [0, 2000]",
      "-1000 <= Node.val <= 1000",
    ],
    examples: [
      {
        input: "root = [3,9,20,null,null,15,7]",
        output: "[[3],[9,20],[15,7]]",
        explanation: "Level 1: [3], Level 2: [9,20], Level 3: [15,7].",
      },
    ],
    timeLimit: 300,
  },

  // ─── Java ──────────────────────────────────────────────────
  {
    id: "java-two-sum",
    title: "Two Sum",
    description: `Given an array of integers \`nums\` and an integer \`target\`, return the indices of the two numbers such that they add up to \`target\`.

Return the answer as an array of two integers (0-indexed).`,
    difficulty: "easy",
    language: "java",
    starterCode: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution here
        return new int[]{};
    }
}`,
    testCases: [
      { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]" },
      { input: "[3,2,4]\n6", expectedOutput: "[1,2]" },
      { input: "[3,3]\n6", expectedOutput: "[0,1]" },
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
    ],
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
      },
    ],
    timeLimit: 300,
  },
  {
    id: "java-linked-list-cycle",
    title: "Linked List Cycle",
    description: `Given \`head\`, the head of a linked list, determine if the linked list has a cycle in it.

There is a cycle in a linked list if there is some node in the list that can be reached again by continuously following the \`next\` pointer.

Return \`true\` if there is a cycle in the linked list. Otherwise, return \`false\`.`,
    difficulty: "easy",
    language: "java",
    starterCode: `public class Solution {
    public boolean hasCycle(ListNode head) {
        // Write your solution here
        return false;
    }
}`,
    testCases: [
      { input: "[3,2,0,-4]\n1", expectedOutput: "true" },
      { input: "[1,2]\n0", expectedOutput: "true" },
      { input: "[1]\n-1", expectedOutput: "false" },
    ],
    constraints: [
      "The number of the nodes in the list is in the range [0, 10^4].",
      "-10^5 <= Node.val <= 10^5",
      "pos is -1 or a valid index in the linked-list.",
    ],
    examples: [
      {
        input: "head = [3,2,0,-4], pos = 1",
        output: "true",
        explanation: "There is a cycle in the linked list, where the tail connects to the 1st node (0-indexed).",
      },
    ],
    timeLimit: 300,
  },

  // ─── C++ ───────────────────────────────────────────────────
  {
    id: "cpp-two-sum",
    title: "Two Sum",
    description: `Given an array of integers \`nums\` and an integer \`target\`, return the indices of the two numbers such that they add up to \`target\`.

Return the answer as a vector of two integers (0-indexed).`,
    difficulty: "easy",
    language: "cpp",
    starterCode: `#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your solution here
        return {};
    }
};`,
    testCases: [
      { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]" },
      { input: "[3,2,4]\n6", expectedOutput: "[1,2]" },
      { input: "[3,3]\n6", expectedOutput: "[0,1]" },
    ],
    constraints: [
      "2 <= nums.size() <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
    ],
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return {0, 1}.",
      },
    ],
    timeLimit: 300,
  },
  {
    id: "cpp-palindrome",
    title: "Valid Palindrome",
    description: `A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.

Given a string \`s\`, return \`true\` if it is a palindrome, or \`false\` otherwise.`,
    difficulty: "easy",
    language: "cpp",
    starterCode: `#include <string>
#include <algorithm>
using namespace std;

class Solution {
public:
    bool isPalindrome(string s) {
        // Write your solution here
        return false;
    }
};`,
    testCases: [
      { input: "A man, a plan, a canal: Panama", expectedOutput: "true" },
      { input: "race a car", expectedOutput: "false" },
      { input: " ", expectedOutput: "true" },
    ],
    constraints: [
      "1 <= s.length <= 2 * 10^5",
      "s consists only of printable ASCII characters.",
    ],
    examples: [
      {
        input: 's = "A man, a plan, a canal: Panama"',
        output: "true",
        explanation: '"amanaplanacanalpanama" is a palindrome.',
      },
    ],
    timeLimit: 300,
  },

  // ─── Go ────────────────────────────────────────────────────
  {
    id: "go-two-sum",
    title: "Two Sum",
    description: `Given an array of integers \`nums\` and an integer \`target\`, return the indices of the two numbers such that they add up to \`target\`.

Return the answer as a slice of two integers (0-indexed).`,
    difficulty: "easy",
    language: "go",
    starterCode: `package main

func twoSum(nums []int, target int) []int {
    // Write your solution here
    return nil
}`,
    testCases: [
      { input: "[2,7,11,15]\n9", expectedOutput: "[0 1]" },
      { input: "[3,2,4]\n6", expectedOutput: "[1 2]" },
      { input: "[3,3]\n6", expectedOutput: "[0 1]" },
    ],
    constraints: [
      "2 <= len(nums) <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
    ],
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0 1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
      },
    ],
    timeLimit: 300,
  },
  {
    id: "go-fibonacci",
    title: "Fibonacci Number",
    description: `The Fibonacci numbers, commonly denoted \`F(n)\`, form a sequence called the Fibonacci sequence, such that each number is the sum of the two preceding ones, starting from 0 and 1.

Given \`n\`, calculate \`F(n)\`.

- F(0) = 0, F(1) = 1
- F(n) = F(n - 1) + F(n - 2), for n > 1`,
    difficulty: "easy",
    language: "go",
    starterCode: `package main

func fibonacci(n int) int {
    // Write your solution here
    return 0
}`,
    testCases: [
      { input: "2", expectedOutput: "1" },
      { input: "3", expectedOutput: "2" },
      { input: "4", expectedOutput: "3" },
      { input: "10", expectedOutput: "55" },
    ],
    constraints: ["0 <= n <= 30"],
    examples: [
      {
        input: "n = 4",
        output: "3",
        explanation: "F(4) = F(3) + F(2) = 2 + 1 = 3.",
      },
    ],
    timeLimit: 180,
  },
];

/**
 * Get a random challenge for a given language and difficulty.
 */
export function getRandomChallenge(
  language: string,
  difficulty?: string
): ChallengeQuestion | undefined {
  const filtered = challenges.filter(
    (c) =>
      c.language === language &&
      (!difficulty || c.difficulty === difficulty)
  );
  if (filtered.length === 0) return undefined;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

/**
 * Get a challenge by ID.
 */
export function getChallengeById(id: string): ChallengeQuestion | undefined {
  return challenges.find((c) => c.id === id);
}

/**
 * Get all available languages for challenges.
 */
export function getAvailableLanguages(): string[] {
  return [...new Set(challenges.map((c) => c.language))];
}
