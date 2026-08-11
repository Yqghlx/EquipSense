using System.ComponentModel.DataAnnotations;
using EquipAI.Application.DTOs.Common;
using FluentAssertions;

namespace EquipAI.Tests.Unit.DTOs;

/// <summary>
/// 通用分页参数校验测试，防止列表接口被异常分页参数拖垮。
/// </summary>
public sealed class PagedQueryValidationTests
{
    [Theory]
    [InlineData(0, 20)]
    [InlineData(1, 0)]
    [InlineData(1, 101)]
    public void 分页参数超出安全范围时应验证失败(int page, int pageSize)
    {
        var query = new PagedQuery { Page = page, PageSize = pageSize };
        var errors = Validate(query);

        errors.Should().NotBeEmpty();
    }

    [Fact]
    public void 分页参数和排序参数合法时应验证通过()
    {
        var query = new PagedQuery
        {
            Page = 2,
            PageSize = 50,
            Sort = "created_at",
            Order = "asc"
        };

        Validate(query).Should().BeEmpty();
    }

    private static IReadOnlyList<ValidationResult> Validate(PagedQuery query)
    {
        var errors = new List<ValidationResult>();
        Validator.TryValidateObject(query, new ValidationContext(query), errors, validateAllProperties: true);
        return errors;
    }
}
