using System.ComponentModel.DataAnnotations;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Application.DTOs.Users;
using FluentAssertions;

namespace EquipAI.Tests.Unit.DTOs;

/// <summary>
/// 用户请求 DTO 的输入边界测试，确保 API 在进入业务层前拒绝无法持久化的数据。
/// </summary>
public sealed class UserRequestValidationTests
{
    [Fact]
    public void 创建用户请求应拒绝超过持久化边界的字段()
    {
        var request = new CreateUserRequest
        {
            Username = new string('u', 51),
            Password = "StrongPass123",
            DisplayName = new string('d', 101),
            Email = new string('a', 243) + "@example.com",
            Phone = new string('1', 33)
        };

        var errors = Validate(request);

        errors.Should().Contain(error => HasMember(error, nameof(CreateUserRequest.Username)));
        errors.Should().Contain(error => HasMember(error, nameof(CreateUserRequest.DisplayName)));
        errors.Should().Contain(error => HasMember(error, nameof(CreateUserRequest.Email)));
        errors.Should().Contain(error => HasMember(error, nameof(CreateUserRequest.Phone)));
    }

    [Fact]
    public void 创建用户请求应拒绝格式错误的邮箱()
    {
        var request = new CreateUserRequest
        {
            Username = "valid-user",
            Password = "StrongPass123",
            Email = "not-an-email"
        };

        var errors = Validate(request);

        errors.Should().Contain(error => HasMember(error, nameof(CreateUserRequest.Email)));
    }

    [Fact]
    public void 更新用户请求应拒绝超过持久化边界的字段()
    {
        var request = new UpdateUserRequest
        {
            DisplayName = new string('d', 101),
            Email = new string('a', 243) + "@example.com",
            Phone = new string('1', 33)
        };

        var errors = Validate(request);

        errors.Should().Contain(error => HasMember(error, nameof(UpdateUserRequest.DisplayName)));
        errors.Should().Contain(error => HasMember(error, nameof(UpdateUserRequest.Email)));
        errors.Should().Contain(error => HasMember(error, nameof(UpdateUserRequest.Phone)));
    }

    [Fact]
    public void 注册和找回密码请求应拒绝超过合法上限的邮箱()
    {
        var longEmail = new string('a', 243) + "@example.com";
        var registerErrors = Validate(new RegisterRequest { Email = longEmail });
        var forgotPasswordErrors = Validate(new ForgotPasswordRequest { Email = longEmail });

        registerErrors.Should().Contain(error => HasMember(error, nameof(RegisterRequest.Email)));
        forgotPasswordErrors.Should().Contain(error => HasMember(error, nameof(ForgotPasswordRequest.Email)));
    }

    private static List<ValidationResult> Validate(object instance)
    {
        var errors = new List<ValidationResult>();
        Validator.TryValidateObject(
            instance,
            new ValidationContext(instance),
            errors,
            validateAllProperties: true);
        return errors;
    }

    private static bool HasMember(ValidationResult error, string memberName)
        => error.MemberNames.Contains(memberName, StringComparer.Ordinal);
}
