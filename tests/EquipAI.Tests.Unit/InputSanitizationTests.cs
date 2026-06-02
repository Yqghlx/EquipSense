using EquipAI.Infrastructure.Middleware;
using FluentAssertions;

namespace EquipAI.Tests.Unit;

/// <summary>
/// 输入净化中间件的恶意内容检测测试
/// 验证 ContainsMaliciousContent 方法能正确识别各类 XSS 攻击模式，同时不误判正常内容
/// </summary>
public class InputSanitizationTests
{
    [Theory]
    [InlineData("<script>alert('xss')</script>", true)]
    [InlineData("<img onerror=alert(1) src=x>", true)]
    [InlineData("javascript:alert(1)", true)]
    [InlineData("<SCRIPT>document.cookie</SCRIPT>", true)]
    [InlineData("onclick=alert(1)", true)]
    [InlineData("正常文本内容", false)]
    [InlineData("{\"name\":\"设备1\",\"type\":\"电机\"}", false)]
    [InlineData("设备温度超过阈值，请检查", false)]
    [InlineData("", false)]
    public void ContainsMaliciousContent_应正确识别(string input, bool expected)
    {
        InputSanitizationMiddleware.ContainsMaliciousContent(input).Should().Be(expected);
    }
}
